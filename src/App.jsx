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
const [points, setPoints] = useState(3);
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);
const addPoint = () => {
  setPoints(prev => Math.min(3, prev + 1));
};

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
  if (pos === null || newGrid[pos]) {
    setMessage("Ungültige Position");
    return;
  }

  // 🔥 Farbprüfung (Nachbarn)
  const neighbors = [
    pos - 1, pos + 1,
    pos - 3, pos + 3
  ];

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

  // 🖌️ BRUSH
  if (brush && cell) {
    const pokemonInTeam = team.find(t => t.id === cell.id);

    if (!pokemonInTeam || points <= 0) return;

    if (pokemonInTeam.eraserDebt > 0) {
      setMessage("Du musst erst Radierer verwenden!");
      return;
    }

    setPoints(prev => prev - 1);

    setTeam(prev =>
      prev.map(t =>
        t.id === cell.id
          ? { ...t, color: "#000000" }
          : t
      )
    );

    return;
  }

  // 🧽 ERASER
  if (eraser && cell) {
    const pokemonInTeam = team.find(t => t.id === cell.id);

    if (!pokemonInTeam || points <= 0) return;

    const count = grid.filter(c => c?.id === cell.id).length;
    if (count <= 1) return;

    setPoints(prev => prev - 1);

    setTeam(prev =>
      prev.map(t =>
        t.id === cell.id
          ? { ...t, eraserDebt: Math.max(0, (t.eraserDebt || 0) - 1) }
          : t
      )
    );

    let newGrid = [...grid];
    newGrid[index] = null;
    setGrid(newGrid);

    return;
  }

  // 📦 NORMAL CLICK
  if (cell) {
    setDragging(cell);
    setSelected(cell);
  } else if (dragging) {
    placeOnGrid(index, dragging);
    setDragging(null);
  }
};

  const catchPokemon = async () => {
  console.log("CLICKED");

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
  nickname: patternModal.nickname || p.name,
  sprite: p.sprites.front_default,
  pattern: [...pattern],
  color: typeColors[p.types[0].type.name] || "gray",
  eraserDebt: patternModal.eraserDebt || 0
};

setSpeciesPatterns(prev => ({
  ...prev,
  [p.name]: [...pattern]
}));

if (patternModal.evolvingId) {
  setTeam(prev => [...prev, newPokemon]);
} else {
  setBox(prev => [...prev, newPokemon]);
}

    setPattern(Array(9).fill(false));
    setPatternModal(null);
    setNickname("");
    setSelectedPokemon(null);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Pokemon Grid</h1>
<div>
  ⭐ Punkte: {points}
  <button 
  onClick={addPoint} 
  disabled={points >= 3}
  style={{ marginLeft: 10 }}
>
  ➕ Punkt
</button>
</div>

    

      <button onClick={() => setBrush(!brush)}>🖌️</button>
      <button onClick={() => setEraser(!eraser)}>🧽</button>

      {message && <p style={{ color: "red" }}>{message}</p>}

      <div style={{ display: "flex", gap: 40 }}>
        {/* GRID */}
        <div>
          <h2>Grid</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,80px)" }}>
            {grid.map((cell, i) => {
              let previewCells = [];

              if (hoverIndex !== null && dragging) {
                previewCells = getOffsets(dragging.pattern)
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
                    background: previewCells.includes(i)
                      ? "rgba(0,0,0,0.3)"
                      : cell
                      ? cell.color
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
      <div key={p.id} draggable onDragStart={() => {
  setDragging(p);
  setSelected(p);
}}
        style={{ border: "1px solid #ccc", padding: 5 }}
      >
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

        {/* 🔥 NEU: Entwicklung */}
        <button onClick={() => {
  console.log("EVOLVE CLICK");
  setEvoModal(p);
setEvoSearch("");
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
      
{/* PATTERN MODAL */}
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
    <div style={{
      background: "white",
      padding: 20,
      borderRadius: 10
    }}>
      <h3>Muster festlegen ({requiredTiles} Felder)</h3>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3,40px)",
        gap: 5
      }}>
        {pattern.map((val, i) => (
          <div
            key={i}
            onClick={() => {
              const count = pattern.filter(v => v).length;
              if (!val && count >= requiredTiles) return;

              const newPattern = [...pattern];
              newPattern[i] = !newPattern[i];
              setPattern(newPattern);
            }}
            style={{
              width: 40,
              height: 40,
              border: "1px solid black",
              background: val ? "black" : "white",
              cursor: "pointer"
            }}
          />
        ))}

      </div>

      <button onClick={() => {
        const count = pattern.filter(v => v).length;

        if (count !== requiredTiles) {
          alert(`Du musst genau ${requiredTiles} Felder wählen!`);
          return;
        }

        const p = patternModal.data;

setSpeciesPatterns(prev => ({
  ...prev,
  [p.name]: [...pattern]
}));

        const newPokemon = {
          id: Date.now(),
          name: p.name,
          nickname: patternModal.nickname || p.name,
          sprite: p.sprites.front_default,
          pattern: [...pattern],
          color: typeColors[p.types[0].type.name] || "gray",
eraserDebt: patternModal.eraserDebt || 0
        };

if (patternModal.evolvingId) {
  setTeam(prev => [...prev, newPokemon]);
} else {
  setBox(prev => [...prev, newPokemon]);
}

        // Reset
        setPattern(Array(9).fill(false));
        setPatternModal(null);
        setSelectedPokemon(null);
        setNickname("");
      }}>
        Bestätigen
      </button>
    </div>
  </div>
)}
{evoModal && (
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
    <div style={{
      background: "white",
      padding: 20,
      borderRadius: 10,
      width: 300
    }}>
      <h3>Entwicklung wählen</h3>

      <input
        placeholder="Pokemon suchen..."
        value={evoSearch}
        onChange={(e) => setEvoSearch(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <div style={{ maxHeight: 200, overflowY: "auto" }}>
        {evoFiltered.slice(0, 10).map(p => {
          const id = p.url.split("/").filter(Boolean).pop();
          const icon = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${id}.png`;

          return (
            <div
              key={p.name}
              style={{ cursor: "pointer", marginBottom: 5 }}
              onClick={async () => {
                try {
                  const res = await fetch(p.url);
                  const data = await res.json();

                  // 1. aus Grid entfernen
setGrid(prev => prev.map(c => c?.id === evoModal.id ? null : c));

// 2. neue requiredTiles berechnen
const newRequired = getEVTiles(data.stats);



const savedPattern = speciesPatterns[data.name];

if (savedPattern) {
  const newPokemon = {
    id: Date.now(),
    name: data.name,
    nickname: evoModal.nickname || evoModal.name,
    sprite: data.sprites.front_default,
    pattern: [...savedPattern],
    color: typeColors[data.types[0].type.name] || "gray",
    eraserDebt: evoModal.eraserDebt || 0
  };

  setTeam(prev => [...prev, newPokemon]);
  setPatternModal(null);
} else {
  // ❗ neues Muster nötig
  setPattern(Array(9).fill(false));
  setRequiredTiles(newRequired);

  setPatternModal({
    data,
    nickname: evoModal.nickname || evoModal.name,
    evolvingId: evoModal.id,
    eraserDebt: evoModal.eraserDebt || 0
  });
}


// 6. altes Pokemon aus Team entfernen
setTeam(prev => prev.filter(t => t.id !== evoModal.id));

// 7. Evo Modal schließen
setEvoModal(null);

                  
                } catch {
                  alert("Fehler bei Entwicklung");
                }
              }}
            >
              <img src={icon} width={30} /> {p.name}
            </div>
          );
        })}
      </div>

      <button onClick={() => setEvoModal(null)}>Abbrechen</button>
    </div>
  </div>
)}

    </div>
  );
}
