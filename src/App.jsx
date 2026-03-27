import { useState, useEffect } from "react";

const emptyGrid = Array(9).fill(null);

export default function App() {
  const [grid, setGrid] = useState(emptyGrid);
  const [team, setTeam] = useState([]);
  const [box, setBox] = useState([]);
  const [graveyard, setGraveyard] = useState([]);

  const [pokemonList, setPokemonList] = useState([]);
  const [dragging, setDragging] = useState(null);

  const [points, setPoints] = useState(0);
  const [eraser, setEraser] = useState(false);
  const [brush, setBrush] = useState(false);

  const [showCatch, setShowCatch] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [nickname, setNickname] = useState("");

  const [patternModal, setPatternModal] = useState(null);
  const [pattern, setPattern] = useState(Array(9).fill(false));
  const [requiredTiles, setRequiredTiles] = useState(1);

  useEffect(() => {
    fetch("https://pokeapi.co/api/v2/pokemon?limit=300")
      .then(res => res.json())
      .then(data => setPokemonList(data.results));
  }, []);

  const filtered = pokemonList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ===== PATTERN LOGIK =====
  const getOffsets = (pattern) => {
    const active = pattern
      .map((v, i) => (v ? i : null))
      .filter(v => v !== null);

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

    // Entferne alte Position
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

  // ===== CATCH =====
  const catchPokemon = async () => {
    if (!selectedPokemon || !nickname) return;

    const res = await fetch(selectedPokemon.url);
    const data = await res.json();

    const tiles = (data.base_experience % 3) + 1;
    setRequiredTiles(tiles);

    setPatternModal({
      data,
      nickname
    });
  };

  return (
    <div style={{ padding: 20, position: "relative" }}>
      <h1>Pokemon Grid</h1>

      {/* Punkte */}
      <h2>
        Punkte: {points}
        <button onClick={() => setPoints(p => Math.min(3, p + 1))}>
          +1
        </button>
      </h2>

      <button onClick={() => setEraser(!eraser)}>🧽</button>
      <button onClick={() => setBrush(!brush)}>🖌️</button>

      {/* GRID + TEAM */}
      <div style={{ display: "flex", gap: 40 }}>
        {/* GRID */}
        <div>
          <h2>Grid</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,80px)" }}>
            {grid.map((cell, i) => (
              <div
                key={i}
                onClick={() => {
                  if (cell) {
                    const id = cell.id;
                    setGrid(grid.map(c => (c?.id === id ? null : c)));
                  } else if (dragging) {
                    placeOnGrid(i, dragging);
                    setDragging(null);
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  placeOnGrid(i, dragging);
                  setDragging(null);
                }}
                style={{
                  width: 80,
                  height: 80,
                  border: "1px solid black",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {cell && (
                  <div style={{ textAlign: "center" }}>
                    <img src={cell.sprite} width={30} />
                    <div style={{ fontSize: 8 }}>{cell.nickname}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* TEAM */}
        <div>
          <h2>Team</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)" }}>
            {team.map(p => (
              <div
                key={p.id}
                draggable
                onDragStart={() => setDragging(p)}
                style={{ marginBottom: 10 }}
              >
                <img src={p.sprite} width={40} />
                <div>{p.nickname}</div>

                {/* MUSTER */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,10px)",
                    gap: 2
                  }}
                >
                  {p.pattern.map((v, i) => (
                    <div
                      key={i}
                      style={{
                        width: 10,
                        height: 10,
                        background: v ? "black" : "#eee"
                      }}
                    />
                  ))}
                </div>

                <button onClick={() => {
                  setBox([...box, p]);
                  setTeam(team.filter(t => t.id !== p.id));
                }}>
                  → Box
                </button>

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
        <div key={p.id}>
          <img src={p.sprite} width={40} />
          {p.nickname}

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
              <div key={p.name} style={{ display: "flex", gap: 10 }}>
                <span
                  style={{
                    fontWeight: selectedPokemon?.name === p.name ? "bold" : "normal",
                    cursor: "pointer"
                  }}
                  onClick={() => setSelectedPokemon(p)}
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

      {/* MODAL */}
      {patternModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{ background: "white", padding: 20 }}>
            <h3>
              Muster für {patternModal.data.name} ({requiredTiles} Felder)
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,40px)" }}>
              {pattern.map((v, i) => (
                <div
                  key={i}
                  onClick={() => {
                    let active = pattern.filter(Boolean).length;
                    let newPattern = [...pattern];

                    if (newPattern[i]) newPattern[i] = false;
                    else {
                      if (active >= requiredTiles) return;
                      newPattern[i] = true;
                    }

                    setPattern(newPattern);
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    border: "1px solid black",
                    background: v ? "black" : "white"
                  }}
                />
              ))}
            </div>

            <button onClick={() => {
              const p = patternModal.data;

              const newPokemon = {
                id: Date.now(),
                name: p.name,
                nickname: patternModal.nickname,
                sprite: p.sprites.front_default,
                pattern
              };

              setBox([...box, newPokemon]);

              setPattern(Array(9).fill(false));
              setPatternModal(null);
              setSelectedPokemon(null);
              setNickname("");
            }}>
              Bestätigen
            </button>

            <button onClick={() => setPatternModal(null)}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
