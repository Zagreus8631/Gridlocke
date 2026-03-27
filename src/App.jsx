import { useState, useEffect } from "react";

const emptyGrid = Array(9).fill(null);

const typeColors = {
  fire: "#e74c3c",
  water: "#3498db",
  grass: "#2ecc71",
  electric: "#f1c40f",
  normal: "#bdc3c7"
};

export default function App() {
  const [grid, setGrid] = useState(emptyGrid);
  const [team, setTeam] = useState([]);
  const [box, setBox] = useState([]);
  const [graveyard, setGraveyard] = useState([]);

  const [pokemonList, setPokemonList] = useState([]);

  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const [points, setPoints] = useState(0);
  const [brush, setBrush] = useState(false);
  const [eraser, setEraser] = useState(false);

  const [showCatch, setShowCatch] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [nickname, setNickname] = useState("");

  const [pattern, setPattern] = useState(Array(9).fill(false));
  const [requiredTiles, setRequiredTiles] = useState(1);
  const [patternModal, setPatternModal] = useState(null);

  const [message, setMessage] = useState("");

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
    if (!active.length) return [];
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
    const r = Math.floor(start / 3) + offset[0];
    const c = (start % 3) + offset[1];
    if (r < 0 || r > 2 || c < 0 || c > 2) return null;
    return r * 3 + c;
  };

  const placeOnGrid = (index, pokemon) => {
    if (!pokemon) return;

    let newGrid = [...grid];
    newGrid = newGrid.map(c => (c?.id === pokemon.id ? null : c));

    const offsets = getOffsets(pokemon.pattern);

    for (let o of offsets) {
      const pos = getGridIndex(index, o);
      if (pos === null || newGrid[pos]) return;
    }

    offsets.forEach(o => {
      const pos = getGridIndex(index, o);
      newGrid[pos] = pokemon;
    });

    setGrid(newGrid);
  };

  const handleGridClick = (index) => {
    const cell = grid[index];

    if (eraser && cell) {
      if (points <= 0) return;

      const count = grid.filter(c => c?.id === cell.id).length;
      if (count <= 1) return;

      setPoints(p => p - 1);

      let newGrid = [...grid];
      newGrid[index] = null;
      setGrid(newGrid);
      return;
    }

    if (cell) {
      setDragging(cell);
      setSelected(cell);
    } else if (dragging) {
      placeOnGrid(index, dragging);
      setDragging(null);
    }
  };

  const catchPokemon = async () => {
    if (!selectedPokemon || !nickname) return;

    const res = await fetch(selectedPokemon.url);
    const data = await res.json();

    setRequiredTiles(1);
    setPatternModal({ data, nickname });
  };

  const confirmPattern = () => {
    const p = patternModal.data;

    const newPokemon = {
      id: Date.now(),
      name: p.name,
      nickname,
      sprite: p.sprites.front_default,
      pattern,
      color: typeColors[p.types[0].type.name] || "gray"
    };

    setBox([...box, newPokemon]);

    setPattern(Array(9).fill(false));
    setPatternModal(null);
    setNickname("");
    setSelectedPokemon(null);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Pokemon Grid</h1>

      <h2>
        Punkte: {points}
        <button onClick={() => setPoints(p => Math.min(3, p + 1))}>+1</button>
      </h2>

      <button onClick={() => setBrush(!brush)}>🖌️</button>
      <button onClick={() => setEraser(!eraser)}>🧽</button>

      <div style={{ display: "flex", gap: 40 }}>
        {/* GRID */}
        <div>
          <h2>Grid</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,80px)" }}>
            {grid.map((cell, i) => (
              <div
                key={i}
                onClick={() => handleGridClick(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  placeOnGrid(i, dragging);
                  setDragging(null);
                }}
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
            <div key={p.id} draggable onDragStart={() => setDragging(p)}>
              <img src={p.sprite} width={40} />
              {p.nickname}
              <button onClick={() => {
                setGraveyard([...graveyard, p]);
                setTeam(team.filter(t => t.id !== p.id));
              }}>
                💀
              </button>
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
          <button onClick={() => {
            setTeam([...team, p]);
            setBox(box.filter(b => b.id !== p.id));
          }}>
            → Team
          </button>
        </div>
      ))}

      {/* GRAVEYARD */}
      <h2>Graveyard</h2>
      {graveyard.map(p => (
        <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <img src={p.sprite} width={40} />
          <span>{p.nickname}</span>

          <button onClick={() => {
            setBox([...box, p]);
            setGraveyard(graveyard.filter(g => g.id !== p.id));
          }}>
            → Box
          </button>
        </div>
      ))}
{/* CATCH */}
<button onClick={() => setShowCatch(!showCatch)}>
  Catch Pokemon
</button>

{showCatch && (
  <div>
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Pokemon suchen..."
    />

    {filtered.slice(0, 10).map(p => {
      const id = p.url.split("/").filter(Boolean).pop();
      const icon = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${id}.png`;

      return (
        <div key={p.name} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span
            style={{
              fontWeight: selectedPokemon?.name === p.name ? "bold" : "normal",
              cursor: "pointer"
            }}
            onClick={() => {
              setSelectedPokemon(p);
              setNickname("");
            }}
          >
            <img src={icon} width={30} /> {p.name}
          </span>

          {selectedPokemon?.name === p.name && (
            <>
              <input
                placeholder="Nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              <button onClick={catchPokemon}>Weiter</button>
            </>
          )}
        </div>
      );
    })}
  </div>
)}
    </div>
  );
}
