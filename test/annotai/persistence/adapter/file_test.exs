defmodule Annotai.Persistence.Adapter.FileTest do
  use ExUnit.Case, async: true

  alias Annotai.Annotation
  alias Annotai.Persistence.Adapter.File, as: FileAdapter

  @moduletag :tmp_dir

  defp config(dir, name \\ "annotations.ets"), do: %{path: Path.join(dir, name)}

  defp annotation(attrs \\ %{}) do
    struct(
      %Annotation{id: "ann_1", inserted_at: "2026-01-01T00:00:00Z", comment: "hi"},
      attrs
    )
  end

  describe "save/2 + load/1 round-trip" do
    test "preserves structs exactly, including atoms, images and thread", %{tmp_dir: dir} do
      annotations = [
        annotation(%{
          id: "ann_a",
          status: :resolved,
          resolved_by: :agent,
          resolved_at: "2026-01-02T00:00:00Z",
          thread: [%{"role" => "human", "content" => "please fix", "at" => "2026-01-01T00:00:01Z"}],
          images: [%{"id" => "img_1", "mime" => "image/png", "data" => "AAAA", "width" => 10, "height" => 10}]
        }),
        annotation(%{id: "ann_b", status: :pending})
      ]

      assert :ok = FileAdapter.save(annotations, config(dir))
      assert {:ok, loaded} = FileAdapter.load(config(dir))
      assert loaded == annotations
    end

    test "an empty set round-trips to []", %{tmp_dir: dir} do
      assert :ok = FileAdapter.save([], config(dir))
      assert {:ok, []} = FileAdapter.load(config(dir))
    end
  end

  describe "load/1" do
    test "missing file loads as an empty set", %{tmp_dir: dir} do
      assert {:ok, []} = FileAdapter.load(config(dir, "does-not-exist.ets"))
    end

    test "corrupt bytes load as an empty set without raising", %{tmp_dir: dir} do
      path = Path.join(dir, "annotations.ets")
      File.write!(path, "this is not an erlang term")

      assert {:ok, []} = FileAdapter.load(%{path: path})
    end

    test "reads a legacy {version, list}-wrapped snapshot", %{tmp_dir: dir} do
      path = Path.join(dir, "annotations.ets")
      annotations = [annotation(%{id: "legacy"})]
      File.write!(path, :erlang.term_to_binary({1, annotations}))

      assert {:ok, ^annotations} = FileAdapter.load(%{path: path})
    end
  end

  describe "save/2" do
    test "creates the parent directory if absent", %{tmp_dir: dir} do
      path = Path.join([dir, "nested", "deeper", "annotations.ets"])

      assert :ok = FileAdapter.save([annotation()], %{path: path})
      assert File.exists?(path)
    end

    test "leaves no leftover temp file", %{tmp_dir: dir} do
      assert :ok = FileAdapter.save([annotation()], config(dir))
      refute File.exists?(Path.join(dir, "annotations.ets.tmp"))
    end
  end
end
