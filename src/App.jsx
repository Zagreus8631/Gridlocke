import { useState, useEffect } from "react"; const emptyGrid = Array(9).fill(null); const typeColors = { fire: "#e74c3c", water: "#3498db", grass: "#2ecc71", electric: "#f1c40f", normal: "#bdc3c7" }; export default function App() { const [grid, setGrid] = useState(emptyGrid); const [team, setTeam] = useState([]); const [box, setBox] = useState([]); const [graveyard, setGraveyard] = useState([]); const [pokemonList, setPokemonList] = useState([]); const [selected, setSelected] = useState(null); const [dragging, setDragging] = useState(null); const [hoverIndex, setHoverIndex] = useState(null); const [points, setPoints] = useState(3); const [brush, setBrush] = useState(false); const [eraser, setEraser] = useState(false); const [showCatch, setShowCatch] = useState(false); const [search, setSearch] = useState(""); const [selectedPokemon, setSelectedPokemon] = useState(null); const [nickname, setNickname] = useState(""); const [pattern, setPattern] = useState(Array(9).fill(false)); const [requiredTiles, setRequiredTiles] = useState(1); const [patternModal, setPatternModal] = useState(null); const [message, setMessage] = useState(""); useEffect(() => { fetch("https://pokeapi.co/api/v2/pokemon?limit=200") .then(res => res.json()) .then(data => setPokemonList(data.results)); }, []); const filtered = pokemonList.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) ); const getEVTiles = (stats) => { const ev = stats.reduce((sum, s) => sum + s.effort, 0); return Math.max(1, ev + 1); }; const getOffsets = (pattern) => { const active = pattern.map((v, i) => (v ? i : null)).filter(v => v !== null); if (!active.length) return []; const base = active[0]; return active.map(i => { const r = Math.floor(i / 3); const c = i % 3; const br = Math.floor(base / 3); const bc = base % 3; return [r - br, c - bc]; }); }; const getGridIndex = (start, offset) => { const r = Math.floor(start / 3) + offset[0]; const c = (start % 3) + offset[1]; if (r < 0 || r > 2 || c < 0 || c > 2) return null; return r * 3 + c; }; const placeOnGrid = (index, pokemon) => { if (!pokemon) return; let newGrid = [...grid]; // remove old placement newGrid = newGrid.map(c => (c?.id === pokemon.id ? null : c)); const offsets = getOffsets(pokemon.pattern); for (let o of offsets) { const pos = getGridIndex(index, o); if (pos === null || newGrid[pos]) { setMessage("Ungültige Position"); return; } } offsets.forEach(o => { const pos = getGridIndex(index, o); newGrid[pos] = pokemon; }); setGrid(newGrid); setMessage(""); }; const handleGridClick = (index) => { const cell = grid[index]; // Radiergummi if (eraser && cell) { if (points <= 0) return; const count = grid.filter(c => c?.id === cell.id).length; if (count <= 1) return; setPoints(points - 1); let newGrid = [...grid]; newGrid[index] = null; setGrid(newGrid); return; } // aufnehmen zum verschieben if (cell) { setDragging(cell); setSelected(cell); } else if (dragging) { placeOnGrid(index, dragging); setDragging(null); } }; const catchPokemon = async () => { if (!selectedPokemon || !nickname) return; const res = await fetch(selectedPokemon.url); const data = await res.json(); setRequiredTiles(getEVTiles(data.stats)); setPatternModal({ data, nickname }); }; const confirmPattern = () => { const count = pattern.filter(v => v).length; if (count !== requiredTiles) { setMessage(Genau ${requiredTiles} Felder!); return; } const p = patternModal.data; const newPokemon = { id: Date.now(), name: p.name, nickname, sprite: p.sprites.front_default, pattern, color: typeColors[p.types[0].type.name] || "gray" }; setBox([...box, newPokemon]); setPattern(Array(9).fill(false)); setPatternModal(null); setNickname(""); setSelectedPokemon(null); }; return ( <div style={{ padding: 20 }}> <h1>Pokemon Grid</h1> <h2>Punkte: {points}</h2> <button onClick={() => setBrush(!brush)}>🖌️ Brush</button> <button onClick={() => setEraser(!eraser)}>🧽 Eraser</button> {message && <p style={{ color: "red" }}>{message}</p>} <div style={{ display: "flex", gap: 40 }}> {/* GRID */} <div> <h2>Grid</h2> <div style={{ display: "grid", gridTemplateColumns: "repeat(3,80px)" }}> {grid.map((cell, i) => { let previewCells = []; if (hoverIndex !== null && selected) { previewCells = getOffsets(selected.pattern) .map(o => getGridIndex(hoverIndex, o)) .filter(v => v !== null); } const isPreview = previewCells.includes(i); return ( <div key={i} onClick={() => handleGridClick(i)} onDragOver={(e) => { e.preventDefault(); setHoverIndex(i); }} onDrop={() => { placeOnGrid(i, selected); setDragging(null); }} style={{ width: 80, height: 80, border: "1px solid black", background: cell ? cell.color : isPreview ? "rgba(0,0,0,0.3)" : "white" }} > {cell && <img src={cell.sprite} width={40} />} </div> ); })} </div> </div> {/* TEAM */} <div> <h2>Team</h2> {team.map(p => ( <div key={p.id} draggable onDragStart={() => setSelected(p)}> <img src={p.sprite} width={40} /> <div>{p.nickname}</div> {/* Muster Vorschau */} <div style={{ display: "grid", gridTemplateColumns: "repeat(3,10px)" }}> {p.pattern.map((val, i) => ( <div key={i} style={{ width: 10, height: 10, background: val ? p.color : "#eee" }} /> ))} </div> <button onClick={() => { setBox([...box, p]); setTeam(team.filter(t => t.id !== p.id)); setGrid(grid.map(c => (c?.id === p.id ? null : c))); }}> → Box </button> <button onClick={() => { setGraveyard([...graveyard, p]); setTeam(team.filter(t => t.id !== p.id)); setGrid(grid.map(c => (c?.id === p.id ? null : c))); }}> 💀 </button> </div> ))} </div> </div> {/* BOX */} <h2>Box</h2> {box.map(p => ( <div key={p.id}> <img src={p.sprite} width={40} /> {p.nickname} <button onClick={() => { if (team.length >= 6) return; setTeam([...team, p]); setBox(box.filter(b => b.id !== p.id)); }}> → Team </button> </div> ))} {/* GRAVEYARD */} <h2>Graveyard</h2> {graveyard.map(p => ( <div key={p.id}>{p.nickname}</div> ))} {/* CATCH */} <button onClick={() => setShowCatch(!showCatch)}> Catch Pokemon </button> {showCatch && ( <div> <input value={search} onChange={(e) => setSearch(e.target.value)} /> {filtered.slice(0, 10).map(p => { const id = p.url.split("/").filter(Boolean).pop(); const icon = https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${id}.png; return ( <div key={p.name}> <span style={{ fontWeight: selectedPokemon?.name === p.name ? "bold" : "normal", cursor: "pointer" }} onClick={() => { setSelectedPokemon(p); setNickname(""); }} > <img src={icon} width={30} /> {p.name} </span> {selectedPokemon?.name === p.name && ( <> <input placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} /> <button onClick={catchPokemon}>Weiter</button> </> )} </div> ); })} </div> )} {/* PATTERN */} {patternModal && ( <div style={{ position: "fixed", top: 50, left: 50, background: "white", padding: 20, border: "2px solid black" }}> <h3>Muster ({requiredTiles})</h3> <div style={{ display: "grid", gridTemplateColumns: "repeat(3,40px)" }}> {pattern.map((val, i) => ( <div key={i} onClick={() => { const count = pattern.filter(v => v).length; if (!val && count >= requiredTiles) return; const newP = [...pattern]; newP[i] = !newP[i]; setPattern(newP); }} style={{ width: 40, height: 40, background: val ? "black" : "#eee" }} /> ))} </div> <button onClick={confirmPattern}>Bestätigen</button> </div> )} </div> ); }import { useState, useEffect } from "react";

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

  const [points, setPoints] = useState(3);
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

    // remove old placement
    newGrid = newGrid.map(c => (c?.id === pokemon.id ? null : c));

    const offsets = getOffsets(pokemon.pattern);

    for (let o of offsets) {
      const pos = getGridIndex(index, o);
      if (pos === null || newGrid[pos]) {
        setMessage("Ungültige Position");
        return;
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

    // Radiergummi
    if (eraser && cell) {
      if (points <= 0) return;

      const count = grid.filter(c => c?.id === cell.id).length;
      if (count <= 1) return;

      setPoints(points - 1);

      let newGrid = [...grid];
      newGrid[index] = null;
      setGrid(newGrid);
      return;
    }

    // aufnehmen zum verschieben
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

    setRequiredTiles(getEVTiles(data.stats));
    setPatternModal({ data, nickname });
  };

  const confirmPattern = () => {
    const count = pattern.filter(v => v).length;
    if (count !== requiredTiles) {
      setMessage(`Genau ${requiredTiles} Felder!`);
      return;
    }

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

      <h2>Punkte: {points}</h2>

      <button onClick={() => setBrush(!brush)}>🖌️ Brush</button>
      <button onClick={() => setEraser(!eraser)}>🧽 Eraser</button>

      {message && <p style={{ color: "red" }}>{message}</p>}

      <div style={{ display: "flex", gap: 40 }}>
        {/* GRID */}
        <div>
          <h2>Grid</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,80px)" }}>
            {grid.map((cell, i) => {
              let previewCells = [];

              if (hoverIndex !== null && selected) {
                previewCells = getOffsets(selected.pattern)
                  .map(o => getGridIndex(hoverIndex, o))
                  .filter(v => v !== null);
              }

              const isPreview = previewCells.includes(i);

              return (
                <div
                  key={i}
                  onClick={() => handleGridClick(i)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHoverIndex(i);
                  }}
                  onDrop={() => {
                    placeOnGrid(i, selected);
                    setDragging(null);
                  }}
                  style={{
                    width: 80,
                    height: 80,
                    border: "1px solid black",
                    background: cell
                      ? cell.color
                      : isPreview
                      ? "rgba(0,0,0,0.3)"
                      : "white"
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
      <div
        key={p.id}
        draggable
        onDragStart={() => setSelected(p)}
        style={{ border: "1px solid #ccc", padding: 5 }}
      >
        <img src={p.sprite} width={40} />
        <div>{p.nickname}</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,10px)" }}>
          {p.pattern.map((val, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                background: val ? p.color : "#eee"
              }}
            />
          ))}
        </div>

        <button onClick={() => {
          const evo = prompt("Neue Entwicklung eingeben:");
          if (!evo) return;

          const updated = { ...p, name: evo };

          setTeam(team.map(t => t.id === p.id ? updated : t));
          setGrid(grid.map(c => c?.id === p.id ? updated : c));
        }}>
          ⬆️ Entwickeln
        </button>

        <button onClick={() => {
          setBox([...box, p]);
          setTeam(team.filter(t => t.id !== p.id));
          setGrid(grid.map(c => (c?.id === p.id ? null : c)));
        }}>
          → Box
        </button>

        <button onClick={() => {
          setGraveyard([...graveyard, p]);
          setTeam(team.filter(t => t.id !== p.id));
          setGrid(grid.map(c => (c?.id === p.id ? null : c)));
        }}>
          💀
        </button>
      </div>
    ))}
  </div>
</div>
        {/* 🔥 NEU: Entwicklung */}
        <button onClick={() => {
          const evo = prompt("Neue Entwicklung eingeben:");
          if (!evo) return;

          const updated = { ...p, name: evo };

          setTeam(team.map(t => t.id === p.id ? updated : t));
          setGrid(grid.map(c => c?.id === p.id ? updated : c));
        }}>
          ⬆️ Entwickeln
        </button>

        <button onClick={() => {
          setBox([...box, p]);
          setTeam(team.filter(t => t.id !== p.id));
          setGrid(grid.map(c => (c?.id === p.id ? null : c)));
        }}>
          → Box
        </button>

        <button onClick={() => {
          setGraveyard([...graveyard, p]);
          setTeam(team.filter(t => t.id !== p.id));
          setGrid(grid.map(c => (c?.id === p.id ? null : c)));
        }}>
          💀
        </button>
      </div>
    ))}
  </div>
</div>
            <div key={p.id} draggable onDragStart={() => setSelected(p)}>
              <img src={p.sprite} width={40} />
              <div>{p.nickname}</div>

              {/* Muster Vorschau */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,10px)" }}>
                {p.pattern.map((val, i) => (
                  <div
                    key={i}
                    style={{
                      width: 10,
                      height: 10,
                      background: val ? p.color : "#eee"
                    }}
                  />
                ))}
              </div>

              <button onClick={() => {
                setBox([...box, p]);
                setTeam(team.filter(t => t.id !== p.id));
                setGrid(grid.map(c => (c?.id === p.id ? null : c)));
              }}>
                → Box
              </button>

              <button onClick={() => {
                setGraveyard([...graveyard, p]);
                setTeam(team.filter(t => t.id !== p.id));
                setGrid(grid.map(c => (c?.id === p.id ? null : c)));
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
            if (team.length >= 6) return;
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
        <div key={p.id}>{p.nickname}</div>
      ))}

      {/* CATCH */}
      <button onClick={() => setShowCatch(!showCatch)}>
        Catch Pokemon
      </button>

      {showCatch && (
        <div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} />

          {filtered.slice(0, 10).map(p => {
            const id = p.url.split("/").filter(Boolean).pop();
            const icon = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${id}.png`;

            return (
              <div key={p.name}>
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

      {/* PATTERN */}
      {patternModal && (
        <div style={{
          position: "fixed",
          top: 50,
          left: 50,
          background: "white",
          padding: 20,
          border: "2px solid black"
        }}>
          <h3>Muster ({requiredTiles})</h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,40px)" }}>
            {pattern.map((val, i) => (
              <div
                key={i}
                onClick={() => {
                  const count = pattern.filter(v => v).length;
                  if (!val && count >= requiredTiles) return;

                  const newP = [...pattern];
                  newP[i] = !newP[i];
                  setPattern(newP);
                }}
                style={{
                  width: 40,
                  height: 40,
                  background: val ? "black" : "#eee"
                }}
              />
            ))}
          </div>

          <button onClick={confirmPattern}>Bestätigen</button>
        </div>
      )}
    </div>
  );
}
