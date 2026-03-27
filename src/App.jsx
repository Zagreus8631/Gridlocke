import { useState, useEffect } from "react";

const emptyGrid = Array(9).fill(null);

const typeColors = {
  fire: "#e74c3c",
  water: "#3498db",
  grass: "#2ecc71",
  electric: "#f1c40f",
  psychic: "#ff69b4",
  ice: "#5dade2",
  dragon: "#6a7baf",
  dark: "#2c3e50",
  fairy: "#e397d1",
  normal: "#bdc3c7"
};

export default function App() {
  const [grid, setGrid] = useState(emptyGrid);
  const [team, setTeam] = useState([]);
  const [box, setBox] = useState([]);
  const [pokemonList, setPokemonList] = useState([]);

  const [selected, setSelected] = useState(null);

  const [showCatch, setShowCatch] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPokemon, setSelectedPokemon] = useState(null);

  const [pattern, setPattern] = useState(Array(9).fill(false));
  const [nickname, setNickname] = useState("");

  const [points, setPoints] = useState(0);
  const [message, setMessage] = useState("");

  const [evolvingId, setEvolvingId] = useState(null);
  const [colorPickerId, setColorPickerId] = useState(null);

  const [eraseMode, setEraseMode] = useState(false);
  const [patternEditId, setPatternEditId] = useState(null);

  useEffect(() => {
    fetch("https://pokeapi.co/api/v2/pokemon?limit=200")
      .then(res => res.json())
      .then(data => setPokemonList(data.results));
  }, []);

  const filtered = pokemonList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const getOffsets = (pattern) => {
    const active = pattern.map((v, i) => (v ? i : null)).filter(v => v !== null);
    if (active.length === 0) return [];

    const base = active[0];

    return active.map(i => {
      const r = Math.floor(i / 3);
      const c = i % 3;
      const br = Math.floor(base / 3);
      const bc = base % 3;
      return [r - br, c - bc];
    });
  };

  const getGridIndex = (start, offset) => {
    const sr = Math.floor(start / 3);
    const sc = start % 3;

    const nr = sr + offset[0];
    const nc = sc + offset[1];

    if (nr < 0 || nr > 2 || nc < 0 || nc > 2) return null;
    return nr * 3 + nc;
  };

  const placeOnGrid = (index) => {
    if (!selected) return;

    const offsets = getOffsets(selected.pattern);
    const newGrid = [...grid];

    // nur 1 Instanz
    for (let i = 0; i < newGrid.length; i++) {
      if (newGrid[i]?.id === selected.id) newGrid[i] = null;
    }

    for (let o of offsets) {
      const pos = getGridIndex(index, o);

      if (pos === null) return setMessage("Muster passt nicht");
      if (newGrid[pos]) return setMessage("Platz belegt");

      const neighbors = [pos - 1, pos + 1, pos - 3, pos + 3];
      for (let n of neighbors) {
        if (n >= 0 && n < 9 && newGrid[n]) {
          if (newGrid[n].color === selected.color) {
            return setMessage("Farben-Konflikt");
          }
        }
      }
    }

    offsets.forEach(o => {
      const pos = getGridIndex(index, o);
      newGrid[pos] = selected;
    });

    setGrid(newGrid);
    setMessage("");
  };

  const removeFromTeam = (pokemon) => {
    setTeam(team.filter(p => p.id !== pokemon.id));
    setBox([...box, pokemon]);
    setGrid(grid.map(c => (c?.id === pokemon.id ? null : c)));
  };

  const catchPokemon = async () => {
    if (!selectedPokemon || !nickname) return;

    const res = await fetch(selectedPokemon.url);
    const data = await res.json();

    const newPokemon = {
      id: Date.now(),
      name: data.name,
      nickname,
      sprite: data.sprites.front_default,
      color: typeColors[data.types[0].type.name] || "gray",
      pattern
    };

    setBox([...box, newPokemon]);

    setPattern(Array(9).fill(false));
    setNickname("");
    setSelectedPokemon(null);
  };

  const moveToTeam = (p) => {
    if (team.length >= 6) return;
    setTeam([...team, p]);
    setBox(box.filter(x => x.id !== p.id));
  };

  const addPoint = () => {
    if (points < 3) setPoints(points + 1);
  };

  // 🧽 Erase Mode
  const eraseTile = (pokemon, index) => {
    if (!eraseMode) return;

    const count = pokemon.pattern.filter(v => v).length;
    if (count <= 1 || points < 1) return;

    pokemon.pattern[index] = false;

    setPoints(points - 1);
    setEraseMode(false);
    setTeam([...team]);
  };

  const changeColor = (pokemon, color) => {
    if (points < 2) return;

    pokemon.color = color;
    setPoints(points - 2);
    setColorPickerId(null);
    setTeam([...team]);
  };

  // 🔄 Evolution
  const handleEvolution = async (pokemon, evo) => {
    const res = await fetch(evo.url);
    const data = await res.json();

    pokemon.name = data.name;
    pokemon.sprite = data.sprites.front_default;

    // aus Grid entfernen!
    setGrid(grid.map(c => (c?.id === pokemon.id ? null : c)));

    setPatternEditId(pokemon.id);
    setPattern(Array(9).fill(false));
  };

  const savePattern = (pokemon) => {
    pokemon.pattern = pattern;

    setPatternEditId(null);
    setPattern(Array(9).fill(false));
    setTeam([...team]);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Pokemon Grid</h1>

      <h2>
        Punkte: {points}
        <button onClick={addPoint}>+1</button>

        <button onClick={() => setEraseMode(!eraseMode)}>
          🧽 {eraseMode ? "ON" : ""}
        </button>

        🖌️ (2)
      </h2>

      {message && <p style={{ color: "red" }}>{message}</p>}

      <div style={{ display: "flex", gap: 40 }}>

        {/* GRID */}
        <div>
          <h2>Grid</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,80px)", gap: 5 }}>
            {grid.map((cell, i) => (
              <div
                key={i}
                title={cell ? cell.nickname : ""}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => placeOnGrid(i)}
                style={{
                  width: 80,
                  height: 80,
                  border: "1px solid black",
                  background: cell ? cell.color : "white"
                }}
              >
                {cell && <img src={cell.sprite} width={40} />}
              </div>
            ))}
          </div>
        </div>

        {/* TEAM */}
        <div>
          <h2>Team</h2>

          {team.map(p => (
            <div key={p.id} style={{ display: "flex", gap: 10 }}>

              <div draggable onDragStart={() => setSelected(p)}>
                <img src={p.sprite} width={40} />
                <div>{p.nickname}</div>
              </div>

              {/* Pattern */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,15px)" }}>
                {p.pattern.map((val, i) => (
                  <div
                    key={i}
                    onClick={() => eraseTile(p, i)}
                    style={{
                      width: 15,
                      height: 15,
                      background: val ? p.color : "#eee",
                      border: "1px solid black"
                    }}
                  />
                ))}
              </div>

              <div>
                <button onClick={() => removeFromTeam(p)}>❌</button>

                {/* Farbe */}
                {colorPickerId === p.id ? (
                  Object.entries(typeColors).map(([t, c]) => (
                    <span
                      key={t}
                      title={t}
                      onClick={() => changeColor(p, c)}
                      style={{
                        width: 20,
                        height: 20,
                        background: c,
                        display: "inline-block",
                        margin: 2,
                        cursor: "pointer"
                      }}
                    />
                  ))
                ) : (
                  <button onClick={() => setColorPickerId(p.id)}>🖌️</button>
                )}

                {/* Evolution */}
                <button onClick={() => setEvolvingId(p.id)}>⬆️</button>

                {evolvingId === p.id && (
                  <div>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} />
                    {filtered.slice(0, 5).map(evo => (
                      <div key={evo.name} onClick={() => handleEvolution(p, evo)}>
                        {evo.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pattern Editor bei Evolution */}
              {patternEditId === p.id && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,30px)" }}>
                    {pattern.map((val, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          const newP = [...pattern];
                          newP[i] = !newP[i];
                          setPattern(newP);
                        }}
                        style={{
                          width: 30,
                          height: 30,
                          background: val ? "black" : "#eee"
                        }}
                      />
                    ))}
                  </div>
                  <button onClick={() => savePattern(p)}>Save</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* BOX */}
      <h2>Box</h2>
      {box.map(p => (
        <div key={p.id}>
          <img src={p.sprite} width={40} />
          {p.nickname}
          <button onClick={() => moveToTeam(p)}>To Team</button>
        </div>
      ))}

      <button onClick={() => setShowCatch(true)}>Catch Pokemon</button>
    </div>
  );
}
