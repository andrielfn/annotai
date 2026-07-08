defmodule Annotai.Annotation do
  @moduledoc """
  The canonical representation of a developer annotation.

  An annotation is created in the browser by the widget (`POST
  /annotai/api/annotations`), enriched and owned by `Annotai.Store`, and read by
  the AI agent through the tools in `Annotai.MCP`.

  This struct is the single source of truth for an annotation's shape. It is
  built from the widget's string-keyed JSON via `new/1`, and serialized back to
  string-keyed JSON at the HTTP and MCP edges through the derived
  `Jason.Encoder` — atom fields such as `:status` encode as their string names
  (e.g. `"pending"`), which is exactly what the widget reads back.

  Timestamps are kept as ISO-8601 strings so they survive the JSON round-trip
  unchanged.
  """

  @statuses [:pending, :acknowledged, :resolved, :dismissed]
  @image_mimes ~w(image/png image/jpeg image/gif image/webp)

  @derive Jason.Encoder
  defstruct id: nil,
            status: :pending,
            comment: nil,
            inserted_at: nil,
            # element identity
            element: nil,
            element_path: nil,
            phx_selector: nil,
            # Phoenix source mapping
            component: nil,
            source_file: nil,
            source_line: nil,
            # visual / textual context
            bounding_box: nil,
            css_classes: nil,
            selected_text: nil,
            nearby_text: nil,
            url: nil,
            # attached screenshots: a list of
            # %{"id","mime","width","height","data"} maps where "data" is base64.
            # Stripped to metadata-only by `redact_images/1` at the JSON edges; the
            # bytes are fetched on demand and handed to the agent as MCP image blocks.
            images: [],
            # marker positioning
            # document-space marker coordinates (%{"x" => _, "y" => _}) — the
            # fallback anchor for annotations whose element can't be re-located.
            point: nil,
            # click position within the element's box as fractions (%{"x" => _,
            # "y" => _}, 0..1); re-applied against the live rect so the marker
            # keeps its relative spot even when the element is a different size.
            anchor_frac: nil,
            # ordinal of the element among same-selector matches at capture time,
            # so a marker re-locates to the right one of several identical rows.
            anchor_index: nil,
            # lifecycle
            thread: [],
            resolved_by: nil,
            resolved_at: nil

  @type status :: :pending | :acknowledged | :resolved | :dismissed

  @typedoc "A reply-thread entry: `%{\"role\" => _, \"content\" => _, \"at\" => _}`."
  @type message :: %{optional(String.t()) => String.t()}

  @type t :: %__MODULE__{
          id: String.t() | nil,
          status: status(),
          comment: String.t() | nil,
          inserted_at: String.t() | nil,
          element: String.t() | nil,
          element_path: String.t() | nil,
          phx_selector: String.t() | nil,
          component: String.t() | nil,
          source_file: String.t() | nil,
          source_line: non_neg_integer() | nil,
          bounding_box: map() | nil,
          css_classes: String.t() | nil,
          selected_text: String.t() | nil,
          nearby_text: String.t() | nil,
          url: String.t() | nil,
          images: [map()],
          point: map() | nil,
          anchor_frac: map() | nil,
          anchor_index: non_neg_integer() | nil,
          thread: [message()],
          resolved_by: :human | :agent | nil,
          resolved_at: String.t() | nil
        }

  @doc "The valid lifecycle statuses, in order."
  @spec statuses() :: [status()]
  def statuses, do: @statuses

  @doc """
  Build an annotation from the widget's string-keyed JSON params.

  Unrecognized keys are ignored; `status` is normalized to an atom (defaulting
  to `:pending`). `id` and `inserted_at` are left `nil` for `Annotai.Store.put/1`
  to fill in. `resolved_by`/`resolved_at` are never accepted from the client.
  """
  @spec new(map()) :: t()
  def new(params) when is_map(params) do
    %__MODULE__{
      id: params["id"],
      status: to_status(params["status"]),
      comment: params["comment"],
      inserted_at: params["inserted_at"],
      element: params["element"],
      element_path: params["element_path"],
      phx_selector: params["phx_selector"],
      component: params["component"],
      source_file: params["source_file"],
      source_line: to_int(params["source_line"]),
      bounding_box: params["bounding_box"],
      css_classes: params["css_classes"],
      selected_text: params["selected_text"],
      nearby_text: params["nearby_text"],
      url: params["url"],
      images: to_images(params["images"]),
      point: params["point"],
      anchor_frac: params["anchor_frac"],
      anchor_index: to_int(params["anchor_index"]),
      thread: params["thread"] || []
    }
  end

  @doc """
  Return the annotation with each image's base64 `"data"` stripped, keeping only
  metadata (`id`, `mime`, `width`, `height`).

  Used at every JSON edge (REST responses, the MCP text block) so heavy image
  bytes never ride along the annotation list / 2s poll. The bytes are fetched on
  demand from the image route and embedded as MCP image blocks instead.
  """
  @spec redact_images(t()) :: t()
  def redact_images(%__MODULE__{images: images} = annotation),
    do: %{annotation | images: Enum.map(images, &Map.delete(&1, "data"))}

  defp to_status(s) when is_binary(s),
    do: Enum.find(@statuses, :pending, &(Atom.to_string(&1) == s))

  defp to_status(_), do: :pending

  # Normalize the widget's image attachments. Each must be a map carrying a known
  # image `mime` and valid base64 `data`; an `id` is assigned when absent. Anything
  # else is dropped — the client is untrusted, the mime is echoed back as a response
  # content-type, and a bad base64 string would corrupt the MCP image block.
  defp to_images(list) when is_list(list), do: Enum.flat_map(list, &normalize_image/1)
  defp to_images(_), do: []

  defp normalize_image(%{"mime" => mime, "data" => data} = img)
       when is_binary(mime) and is_binary(data) do
    if mime in @image_mimes and match?({:ok, _}, Base.decode64(data)) do
      [
        %{
          "id" => image_id(img["id"]),
          "mime" => mime,
          "data" => data,
          "width" => to_int(img["width"]),
          "height" => to_int(img["height"])
        }
      ]
    else
      []
    end
  end

  defp normalize_image(_), do: []

  defp image_id(id) when is_binary(id) and id != "", do: id
  defp image_id(_), do: "img_" <> (:crypto.strong_rand_bytes(6) |> Base.url_encode64(padding: false))

  defp to_int(n) when is_integer(n), do: n
  defp to_int(s) when is_binary(s), do: with({n, _} <- Integer.parse(s), do: n, else: (_ -> nil))
  defp to_int(_), do: nil
end
