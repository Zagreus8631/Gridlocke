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

  const [dragging, setDragging] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const [eraser, setEraser] = useState(false);

  const [showCatch, setShowCatch] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [nickname, setNickname] = useState("");

  const [pattern, setPattern] = useState(Array(9).fill(false));
  const [requiredTiles, setRequiredTiles] = useState(1);
  const [patternModal, setPatternModal] = useState(null);

  const [message, setMessage] = useState("");

  const [evoModal, setEvoModal] = useState(null);
  const [evoSearch, setEvoSearch] = useState("");

  const [speciesPatterns, setSpeciesPatterns] = useState({});

  useEffect(() => {
    fetch("https://pokeapi.co/api/v2/pokemon?limit=200")
      .then(res => res.json())
      .then(data => setPokemonList(data.results));
  }, []);

  const filtered = pokemonList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const evoFiltered = pokemonList.filter(p =>
    p.name.toLowerCase().includes(evoSearch.toLowerCase())
  );

  const getEVTiles = (stats) => {
    const ev = stats.reduce((sum, s) => sum + s.effort, 0);
    return Math.max(1, ev + 1);
  };

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

      const neighbors = [pos - 1, pos + 1, pos - 3, pos + 3];
      for (let n of neighbors) {
        if (
          n >= 0 && n < 9 &&
          newGrid[n] &&
          newGrid[n].color === pokemon.color
        ) {
          setMessage("Gleiche Farbe darf nicht angrenzen!");
          return;
        }
      }
    }

    offsets.forEach(o => {
      const pos = getGridIndex(index, o);
      newGrid[pos] = pokemon;
    });

    setGrid(newGrid);
    setMessage("");
  };

  const handleGridClick = (index) => {
    const cell = grid[index];

    if (eraser && cell) {
      const pokemon = team.find(t => t.id === cell.id);
      if (!pokemon || pokemon.eraserUsed <= 0) return;

      setTeam(prev =>
        prev.map(t =>
          t.id === cell.id
            ? { ...t, eraserUsed: t.eraserUsed - 1 }
            : t
        )
      );

      let newGrid = [...grid];
      newGrid[index] = null;
      setGrid(newGrid);
      return;
    }

    if (cell) {
      setDragging(cell);
    } else if (dragging) {
      placeOnGrid(index, dragging);
      setDragging(null);
    }
  };

  const openPatternModal = (data, nickname, evolvingId = null, eraserUsed = 0) => {
    const saved = speciesPatterns[data.name];

    if (saved) {
      const newPokemon = {
        id: evolvingId || Date.now(),
        name: data.name,
        nickname,
        sprite: data.sprites.front_default,
        pattern: saved,
        color: typeColors[data.types[0].type.name] || "gray",
        eraserUsed
      };

      if (evolvingId) {
        setTeam(prev => [...prev, newPokemon]);
      } else {
        setBox(prev => [...prev, newPokemon]);
      }

      return;
    }

    setPattern(Array(9).fill(false));
    setRequiredTiles(getEVTiles(data.stats));

    setPatternModal({
      data,
      nickname,
      evolvingId,
      eraserUsed
    });
  };

  const confirmPattern = () => {
    const count = pattern.filter(v => v).length;
    if (count !== requiredTiles) return;

    const p = patternModal.data;

    setSpeciesPatterns(prev => ({
      ...prev,
      [p.name]: [...pattern]
    }));

    const newPokemon = {
      id: patternModal.evolvingId || Date.now(),
      name: p.name,
      nickname: patternModal.nickname,
      sprite: p.sprites.front_default,
      pattern: [...pattern],
      color: typeColors[p.types[0].type.name] || "gray",
      eraserUsed: patternModal.eraserUsed
    };

    if (patternModal.evolvingId) {
      setTeam(prev => [...prev, newPokemon]);
    } else {
      setBox(prev => [...prev, newPokemon]);
    }

    setPatternModal(null);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Pokemon Grid</h1>

      <button onClick={() => setEraser(!eraser)}>🧽</button>

      <div style={{ display: "flex", gap: 40 }}>
        {/* GRID */}
        <div>
          <h2>Grid</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,80px)" }}>
            {grid.map((cell, i) => {
              let preview = [];
              if (hoverIndex !== null && dragging) {
                preview = getOffsets(dragging.pattern)
                  .map(o => getGridIndex(hoverIndex, o))
                  .filter(v => v !== null);
              }

              return (
                <div
                  key={i}
                  onClick={() => handleGridClick(i)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHoverIndex(i);
                  }}
                  onDrop={() => {
                    placeOnGrid(i, dragging);
                    setDragging(null);
                  }}
                  style={{
                    width: 80,
                    height: 80,
                    border: "1px solid black",
                    background: preview.includes(i)
                      ? "rgba(0,0,0,0.3)"
                      : cell ? cell.color : "white"
                  }}
                >
                  {cell && <img src={cell.sprite} width={40} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* TEAM */}
        <div>
          <h2>Team</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 10
          }}>
            {team.map(p => (
              <div key={p.id} draggable onDragStart={() => setDragging(p)}>
                <img src={p.sprite} width={40} />
                <div>{p.nickname}</div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,10px)" }}>
                  {p.pattern.map((v, i) => (
                    <div key={i} style={{
                      width: 10,
                      height: 10,
                      background: v ? p.color : "#eee"
                    }} />
                  ))}
                </div>

                <button onClick={() => {
                  setEvoModal(p);
                  setEvoSearch("");
                }}>⬆️ Entwickeln</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PATTERN MODAL */}
      {patternModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{ background: "white", padding: 20 }}>
            <h3>Muster ({requiredTiles})</h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,40px)" }}>
              {pattern.map((val, i) => (
                <div key={i}
                  onClick={() => {
                    const count = pattern.filter(v => v).length;
                    if (!val && count >= requiredTiles) return;
                    const copy = [...pattern];
                    copy[i] = !copy[i];
                    setPattern(copy);
                  }}
                  style={{
                    width: 40, height: 40,
                    background: val ? "black" : "white",
                    border: "1px solid black"
                  }}
                />
              ))}
            </div>

            <button onClick={confirmPattern}>Bestätigen</button>
          </div>
        </div>
      )}
    </div>
  );
}
