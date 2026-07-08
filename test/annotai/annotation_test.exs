defmodule Annotai.AnnotationTest do
  use ExUnit.Case, async: true

  alias Annotai.Annotation

  describe "new/1" do
    test "maps string-keyed params into the struct" do
      ann =
        Annotation.new(%{
          "comment" => "make it blue",
          "status" => "acknowledged",
          "element" => "button",
          "element_path" => "form > button",
          "phx_selector" => "#save",
          "source_file" => "lib/demo.ex",
          "source_line" => "42",
          "point" => %{"x" => 100, "y" => 200},
          "bounding_box" => %{"x" => 1, "y" => 2, "width" => 3, "height" => 4}
        })

      assert %Annotation{} = ann
      assert ann.comment == "make it blue"
      assert ann.status == :acknowledged
      assert ann.source_line == 42
      assert ann.point == %{"x" => 100, "y" => 200}
    end

    test "with empty params: status :pending, thread [], id/inserted_at nil (Store fills them)" do
      ann = Annotation.new(%{})
      assert ann.status == :pending
      assert ann.thread == []
      assert ann.id == nil
      assert ann.inserted_at == nil
    end

    test "passes a client-supplied id/inserted_at through (Store only fills when absent)" do
      ann = Annotation.new(%{"id" => "ann_custom", "inserted_at" => "2020-01-01T00:00:00Z"})
      assert ann.id == "ann_custom"
      assert ann.inserted_at == "2020-01-01T00:00:00Z"
    end

    test "unknown status falls back to :pending" do
      assert Annotation.new(%{"status" => "bogus"}).status == :pending
    end

    test "never accepts resolution metadata from the client" do
      ann = Annotation.new(%{"resolved_by" => "agent", "resolved_at" => "2020-01-01T00:00:00Z"})
      assert ann.resolved_by == nil
      assert ann.resolved_at == nil
    end

    test "coerces source_line: integer kept, numeric string parsed, junk -> nil" do
      assert Annotation.new(%{"source_line" => 7}).source_line == 7
      assert Annotation.new(%{"source_line" => "7"}).source_line == 7
      assert Annotation.new(%{"source_line" => "nope"}).source_line == nil
      assert Annotation.new(%{}).source_line == nil
    end
  end

  describe "images" do
    test "normalizes image attachments and assigns an id when absent" do
      ann =
        Annotation.new(%{
          "images" => [
            %{"mime" => "image/png", "data" => "AAAA", "width" => "10", "height" => 20},
            %{"id" => "img_keep", "mime" => "image/jpeg", "data" => "BBBB"}
          ]
        })

      assert [first, second] = ann.images
      assert first["mime"] == "image/png"
      assert first["data"] == "AAAA"
      assert first["width"] == 10
      assert first["height"] == 20
      assert first["id"] =~ ~r/^img_/
      assert second["id"] == "img_keep"
    end

    test "drops entries that are not maps with binary mime + data" do
      ann =
        Annotation.new(%{
          "images" => [
            %{"mime" => "image/png", "data" => "AAAA"},
            %{"mime" => "image/png"},
            "junk",
            %{"mime" => 1, "data" => 2}
          ]
        })

      assert length(ann.images) == 1
    end

    test "missing/invalid images key -> empty list" do
      assert Annotation.new(%{}).images == []
      assert Annotation.new(%{"images" => "nope"}).images == []
    end

    test "drops images with a non-image mime or invalid base64 (untrusted client)" do
      ann =
        Annotation.new(%{
          "images" => [
            %{"mime" => "text/html", "data" => "AAAA"},
            %{"mime" => "image/png", "data" => "not base64!!"},
            %{"mime" => "image/png", "data" => "AAAA"}
          ]
        })

      assert [%{"mime" => "image/png", "data" => "AAAA"}] = ann.images
    end

    test "redact_images/1 strips data but keeps metadata" do
      ann =
        Annotation.new(%{
          "images" => [%{"id" => "img_1", "mime" => "image/png", "data" => "AAAA", "width" => 4}]
        })

      assert [img] = Annotation.redact_images(ann).images
      refute Map.has_key?(img, "data")
      assert img["id"] == "img_1"
      assert img["mime"] == "image/png"
      assert img["width"] == 4
    end
  end

  describe "Jason.Encoder" do
    test "serializes to string-keyed JSON with atom status as a string" do
      json =
        %{"comment" => "hi", "status" => "pending", "source_line" => "9"}
        |> Annotation.new()
        |> Map.put(:id, "ann_x")
        |> Jason.encode!()
        |> Jason.decode!()

      assert json["status"] == "pending"
      assert json["comment"] == "hi"
      assert json["source_line"] == 9
      assert json["id"] == "ann_x"
      refute Map.has_key?(json, "__struct__")
    end
  end

  test "statuses/0 lists the lifecycle states in order" do
    assert Annotation.statuses() == [:pending, :acknowledged, :resolved, :dismissed]
  end
end
