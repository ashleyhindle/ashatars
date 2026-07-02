defmodule Heeds.Svg do
  @available_svg_paths %{
    circles: {[1, 3, 4], []},
    lines: {[3, 4, 5, 6, 7, 8], []},
    grid: {[1, 2, 3, 4, 5, 6], []},
    diagonal_grid: {[2, 3, 4, 5], []},
    squares: {[1, 2, 3, 4], []},
    mountains: {[4, 5, 6], []},
    zigzag_vertical: {[2, 4, 5, 6], []},
    wiggles: {[1, 2, 3], []},
    sunrise: {[3, 4, 5, 6], []},
    clock: {[2, 3], []},
    dots: {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], []},
    concentric_arcs: {[2, 3, 4], []},
    iris: {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12], []},
    wave: {[3, 4, 5], []},
    blob_face: {[3, 4, 5, 6, 7, 8, 9, 10], []},
    carets: {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12], []}
  }

  def available_svg_paths, do: @available_svg_paths

  def get(type) do
    {random_number_opts, args} = Map.get(@available_svg_paths, type)
    random_number = Enum.random(random_number_opts)

    apply(__MODULE__, type, [random_number] ++ args)
  end

  def random_svg_paths() do
    svg_function = Enum.random(Map.keys(@available_svg_paths))
    get(svg_function)
  end

  def svg_name(type) do
    type |> to_string() |> Macro.camelize()
  end

  def sunrise(num_lines \\ 3, max_y \\ 340) do
    start_y = Enum.random(2..50)
    max_step = trunc(div(max_y, num_lines))

    Enum.reduce(1..num_lines, {start_y, []}, fn _, {current_y, paths} ->
      new_path = "M0,#{current_y} H512"
      step_y = :rand.uniform(max_step - 30) + 30
      new_y = min(current_y + step_y, max_y)
      {new_y, [new_path | paths]}
    end)
    |> elem(1)
    |> Enum.reverse()
  end

  def lines(num_sides) do
    center_x = 256
    center_y = 256
    radius_x = 240
    radius_y = 240

    points =
      for _ <- 1..num_sides do
        # Convert 20 degrees to radians
        min_angle = 20 * :math.pi() / 180
        max_angle = 2 * :math.pi() - min_angle
        angle = min_angle + :rand.uniform() * (max_angle - min_angle)
        # Add some randomness to the radius to create more space in the middle
        x = center_x + radius_x * :math.cos(angle)
        y = center_y + radius_y * :math.sin(angle)
        "#{trunc(x)},#{trunc(y)}"
      end

    path_commands =
      Enum.reduce(points, [], fn point, acc ->
        acc ++ ["L#{point}"]
      end)

    ["M#{hd(points)} #{Enum.join(tl(path_commands), " ")} Z"]
  end

  @doc """
  Returns a list of SVG paths for a given number of circles
  """
  def circles(num_circles) do
    Enum.map(1..num_circles, fn _ ->
      # Generate random position within the SVG viewport
      x = :rand.uniform(500)
      y = :rand.uniform(500)

      size = :rand.uniform(121) + 30

      "M#{x},#{y} a#{size},#{size} 0 1,0 #{size * 2},0 a#{size},#{size} 0 1,0 -#{size * 2},0"
    end)
  end

  @doc """
  Returns a list of SVG paths for a square grid of dots
  """
  def dots(num_dots) do
    # Calculate the number of dots per side (rounded up to the nearest integer)
    dots_per_side = :math.ceil(:math.sqrt(num_dots)) |> trunc()

    # Calculate the spacing between dots
    spacing = 512 / (dots_per_side + 1)
    dot_size = :rand.uniform(20) + 1
    # Generate the grid of dots
    for row <- 1..dots_per_side,
        col <- 1..dots_per_side,
        row * col <= num_dots do
      x = (col - 0.5) * spacing
      y = (row - 0.5) * spacing
      # Fixed size for all dots

      "M#{trunc(x)},#{trunc(y)} a#{dot_size},#{dot_size} 0 1,0 #{dot_size * 2},0 a#{dot_size},#{dot_size} 0 1,0 -#{dot_size * 2},0"
    end
  end

  @doc """
  Returns a list of SVG paths for a random, irregular grid
  """
  def grid(num_lines \\ 4) do
    horizontal_lines =
      Enum.reduce(1..num_lines, [], fn _, acc ->
        y = :rand.uniform(512)
        line = "M0,#{y} L512,#{y}"
        [line | acc]
      end)

    vertical_lines =
      Enum.reduce(1..num_lines, [], fn _, acc ->
        x = :rand.uniform(512)
        line = "M#{x},0 L#{x},512"
        [line | acc]
      end)

    # Randomly remove some lines to create more variety
    all_lines = horizontal_lines ++ vertical_lines
    Enum.take_random(all_lines, trunc(length(all_lines) * 0.7))
  end

  @doc """
  Returns a list of SVG paths for a given number of small squares
  """
  def squares(num_squares) do
    Enum.map(1..num_squares, fn _ ->
      # Generate random position within the SVG viewport
      x = Enum.random(40..430)
      y = Enum.random(40..430)

      size = :rand.uniform(200) + 40
      "M#{x},#{y} h#{size} v#{size} h-#{size} z"
    end)
  end

  @doc """
  Returns a list with a single SVG path for a mountain-like pattern
  """
  def mountains(num_peaks) do
    start_x = 0
    start_y = :rand.uniform(512) + 300
    end_y = 512 - :rand.uniform(100)

    mountain_points =
      Enum.reduce(0..num_peaks, [{start_x, start_y}], fn i, [{prev_x, _prev_y} | _] = acc ->
        segment_length = :rand.uniform(120) + 40
        x = prev_x + segment_length
        y_variation = :rand.uniform(160) + 60
        y = if rem(i, 2) != 0, do: start_y - y_variation, else: end_y - y_variation
        [{x, y} | acc]
      end)

    path =
      mountain_points
      |> Enum.reverse()
      |> Enum.map(fn {x, y} -> "#{trunc(x)},#{trunc(y)}" end)
      |> Enum.join(" L")
      |> IO.inspect()

    ["M" <> path <> " L512,512"]
  end

  def zigzag_vertical(num_zigzags) do
    start_x = :rand.uniform(350) + 200
    start_y = :rand.uniform(25)
    end_x = :rand.uniform(50)

    zigzag_points =
      Enum.reduce(0..num_zigzags, [{start_x, start_y}], fn i, [{_prev_x, prev_y} | _] = acc ->
        segment_length = :rand.uniform(160) + 20
        y = prev_y + segment_length
        x_variation = :rand.uniform(50) - 25
        x = if rem(i, 2) == 0, do: start_x - x_variation, else: end_x - x_variation
        [{x, y} | acc]
      end)

    path =
      zigzag_points
      |> Enum.reverse()
      |> Enum.map(fn {x, y} -> "#{trunc(x)},#{trunc(y)}" end)
      |> Enum.join(" L")

    ["M" <> path]
  end

  @doc """
  Returns a list of SVG paths for random wiggly lines
  """
  def wiggles(num_wiggles) do
    start_x = :rand.uniform(512)
    start_y = 0
    step_size = div(512, num_wiggles) |> round()

    curve_commands =
      Enum.reduce(1..num_wiggles, {start_x, start_y, []}, fn i, {prev_x, prev_y, acc} ->
        # Calculate new x and y with some randomness
        new_x =
          if start_x > 250 do
            prev_x - Enum.random(trunc(step_size / 4)..trunc(step_size / 2))
          else
            prev_x + Enum.random(trunc(step_size / 4)..trunc(step_size / 2))
          end

        new_y = prev_y + Enum.random(trunc(step_size / 2)..step_size)

        # Ensure we don't exceed the SVG boundaries
        end_x = min(new_x, 512)
        end_y = min(new_y, 512)

        # Calculate control points
        control_x =
          if start_x > 250 do
            end_x - Enum.random(150..380)
          else
            end_x + Enum.random(150..380)
          end

        control_y = end_y - Enum.random(100..300)

        end_y = if i == num_wiggles, do: 512, else: end_y

        {end_x, end_y,
         acc ++ ["S#{trunc(control_x)},#{trunc(control_y)} #{trunc(end_x)},#{trunc(end_y)}"]}
      end)

    {_, _, curve_commands} = curve_commands
    curve_commands = curve_commands |> Enum.join(" ")

    ["M#{start_x},#{start_y} " <> curve_commands]
  end

  @doc """
  Returns a list of SVG paths for a random, irregular diagonal grid
  """
  def diagonal_grid(num_lines \\ 4) do
    rotation_angle = :rand.uniform(70) + 19

    horizontal_lines =
      Enum.map(1..num_lines, fn _ ->
        y = :rand.uniform(512)
        %{x1: 0, y1: y, x2: 512, y2: y}
      end)

    vertical_lines =
      Enum.map(1..num_lines, fn _ ->
        x = :rand.uniform(512)
        %{x1: x, y1: 0, x2: x, y2: 512}
      end)

    all_lines = horizontal_lines ++ vertical_lines
    selected_lines = Enum.take_random(all_lines, num_lines)

    # Apply rotation to all selected lines
    rotated_lines =
      Enum.map(selected_lines, fn line ->
        rotate_line(line, rotation_angle)
      end)

    Enum.map(rotated_lines, fn %{x1: x1, y1: y1, x2: x2, y2: y2} ->
      "M#{trunc(x1)},#{trunc(y1)} L#{trunc(x2)},#{trunc(y2)}"
    end)
  end

  # Helper function to rotate a line
  defp rotate_line(%{x1: x1, y1: y1, x2: x2, y2: y2}, angle) do
    # Convert angle to radians
    angle_rad = angle * :math.pi() / 180

    # Center of rotation (center of the SVG)
    cx = cy = 256

    # Rotate the start point
    rx1 = cx + (x1 - cx) * :math.cos(angle_rad) - (y1 - cy) * :math.sin(angle_rad)
    ry1 = cy + (x1 - cx) * :math.sin(angle_rad) + (y1 - cy) * :math.cos(angle_rad)

    # Rotate the end point
    rx2 = cx + (x2 - cx) * :math.cos(angle_rad) - (y2 - cy) * :math.sin(angle_rad)
    ry2 = cy + (x2 - cx) * :math.sin(angle_rad) + (y2 - cy) * :math.cos(angle_rad)

    %{x1: rx1, y1: ry1, x2: rx2, y2: ry2}
  end

  @doc """
  Returns a list of SVG paths for a clock-like pattern with straight lines
  """
  def clock(num_lines) do
    center_x = 256
    center_y = 256
    max_radius = 280
    # 20 degrees in radians
    min_angle_diff = 20 * :math.pi() / 180

    Enum.reduce(1..num_lines, {[], []}, fn _, {paths, last_angles} ->
      new_angle = generate_new_angle(last_angles, min_angle_diff)
      length = Enum.random(80..max_radius)
      end_x = center_x + length * :math.cos(new_angle)
      end_y = center_y + length * :math.sin(new_angle)

      new_path = "M#{center_x},#{center_y} L#{trunc(end_x)},#{trunc(end_y)}"
      {[new_path | paths], [new_angle | last_angles]}
    end)
    |> elem(0)
    |> Enum.reverse()
  end

  defp generate_new_angle(nil, _min_diff), do: :rand.uniform() * 2 * :math.pi()

  defp generate_new_angle(last_angles, min_diff) when is_list(last_angles) do
    new_angle = trunc(:rand.uniform() * 2 * :math.pi())

    if Enum.all?(
         last_angles,
         fn last_angle -> abs(new_angle - last_angle) >= min_diff end
       ) do
      new_angle
    else
      generate_new_angle(last_angles, min_diff)
    end
  end

  @doc """
  Returns a list of SVG paths for non-intersecting curved lines that follow a circular shape
  """
  def concentric_arcs(num_arcs) do
    center_x = 256
    center_y = 256
    max_radius = 240
    # Minimum gap between arcs
    min_gap = 5

    Enum.map(1..num_arcs, fn i ->
      radius = max_radius * (i / num_arcs)
      start_angle = :rand.uniform() * 2 * :math.pi()
      # Between 1/4 and 3/4 of a full circle
      arc_length = (:rand.uniform() * 0.5 + 0.25) * 2 * :math.pi()

      end_angle = start_angle + arc_length

      # Ensure minimum gap between arcs
      adjusted_radius = radius - (i - 1) * min_gap

      start_x = center_x + adjusted_radius * :math.cos(start_angle)
      start_y = center_y + adjusted_radius * :math.sin(start_angle)
      end_x = center_x + adjusted_radius * :math.cos(end_angle)
      end_y = center_y + adjusted_radius * :math.sin(end_angle)

      large_arc_flag = if arc_length > :math.pi(), do: 1, else: 0

      "M#{trunc(start_x)},#{trunc(start_y)} " <>
        "A#{trunc(adjusted_radius)},#{trunc(adjusted_radius)} 0 #{large_arc_flag},1 #{trunc(end_x)},#{trunc(end_y)}"
    end)
  end

  @doc """
  Returns a list of SVG paths for a mechanical iris-like pattern
  """
  def iris(num_petals) do
    center_x = 256
    center_y = 256
    outer_radius = 240
    # Random inner radius
    inner_radius = :rand.uniform(outer_radius - 100) + 30
    petal_width = 2 * :math.pi() / num_petals

    petals =
      Enum.map(0..(num_petals - 1), fn i ->
        start_angle = i * petal_width
        end_angle = (i + 1) * petal_width

        # Calculate points for the petal
        outer_start_x = center_x + outer_radius * :math.cos(start_angle)
        outer_start_y = center_y + outer_radius * :math.sin(start_angle)
        outer_end_x = center_x + outer_radius * :math.cos(end_angle)
        outer_end_y = center_y + outer_radius * :math.sin(end_angle)
        inner_start_x = center_x + inner_radius * :math.cos(start_angle)
        inner_start_y = center_y + inner_radius * :math.sin(start_angle)
        inner_end_x = center_x + inner_radius * :math.cos(end_angle)
        inner_end_y = center_y + inner_radius * :math.sin(end_angle)

        # Create the petal path
        "M#{trunc(outer_start_x)},#{trunc(outer_start_y)} " <>
          "A#{outer_radius},#{outer_radius} 0 0,1 #{trunc(outer_end_x)},#{trunc(outer_end_y)} " <>
          "L#{trunc(inner_end_x)},#{trunc(inner_end_y)} " <>
          "A#{inner_radius},#{inner_radius} 0 0,0 #{trunc(inner_start_x)},#{trunc(inner_start_y)} " <>
          "Z"
      end)

    # Add a circle in the center for a smoother look
    center_circle =
      "M#{center_x},#{center_y - inner_radius} " <>
        "A#{inner_radius},#{inner_radius} 0 1,1 #{center_x - 0.1},#{center_y - inner_radius}"

    petals ++ [center_circle]
  end

  @doc """
  Returns a list with a single SVG path for multiple relaxed, rolling waves from left to right
  """
  def wave(num_waves) do
    base_y = :rand.uniform(100) + 250
    segment_width = 512 / num_waves

    path =
      Enum.reduce(0..(num_waves - 1), "M0,#{base_y}", fn i, path ->
        start_x = i * segment_width
        end_x = (i + 1) * segment_width

        wave_height = :rand.uniform(180) + 20

        # Alternate between peaks and troughs
        mid_y = if rem(i, 2) == 0, do: base_y - wave_height, else: base_y + wave_height

        # Use more relaxed control points
        control_x1 = start_x + segment_width * 0.25
        control_x2 = end_x - segment_width * 0.25

        path <>
          " C#{control_x1},#{mid_y} #{control_x2},#{mid_y} #{end_x},#{base_y}"
      end)

    [path]
  end

  def blob_face(_num_points) do
    hair_paths = sunrise(2, 180)

    # Generate eye positions
    eye1_x = Enum.random(100..280)
    eye1_y = Enum.random(190..240)
    eye2_x = eye1_x + Enum.random(100..170)
    eye2_y = eye1_y

    # Create eye paths
    eye_radius = Enum.random(3..20)

    eye1_path =
      "M#{eye1_x},#{eye1_y} a#{eye_radius},#{eye_radius} 0 1,0 #{eye_radius * 2},0 a#{eye_radius},#{eye_radius} 0 1,0 -#{eye_radius * 2},0"

    eye2_path =
      "M#{eye2_x},#{eye2_y} a#{eye_radius},#{eye_radius} 0 1,0 #{eye_radius * 2},0 a#{eye_radius},#{eye_radius} 0 1,0 -#{eye_radius * 2},0"

    # Generate smile curve
    smile_start_x = eye1_x
    smile_start_y = eye1_y + Enum.random(140..180)
    smile_end_x = smile_start_x + Enum.random(40..230)
    smile_end_y = smile_start_y
    smile_control_x = smile_start_x + (smile_end_x - smile_start_x) / 2
    smile_control_y = smile_start_y + Enum.random(40..70)

    smile_path =
      "M#{smile_start_x},#{smile_start_y} Q#{smile_control_x},#{smile_control_y} #{smile_end_x},#{smile_end_y}"

    hair_paths ++
      [
        eye1_path,
        eye2_path,
        smile_path
      ]
  end

  @doc """
  Returns a list of SVG paths for a square grid of caret symbols (^)
  """
  def carets(num_carets) do
    # Calculate the number of carets per side (rounded up to the nearest integer)
    carets_per_side = :math.ceil(:math.sqrt(num_carets)) |> trunc()

    # Calculate the spacing between carets
    spacing = 512 / (carets_per_side + 1)
    # Random size between 6 and 20
    caret_size = :rand.uniform(35) + 25

    # Generate the grid of carets
    for row <- 1..carets_per_side,
        col <- 1..carets_per_side,
        row * col <= num_carets do
      x = (col + 0.1) * spacing
      y = (row + 0.1) * spacing

      # Create the caret path
      "M#{trunc(x - caret_size)},#{trunc(y + caret_size)} " <>
        "L#{trunc(x)},#{trunc(y - caret_size)} " <>
        "L#{trunc(x + caret_size)},#{trunc(y + caret_size)}"
    end
  end
end