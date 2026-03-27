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
  normal: "#bdc3c7",
  fighting: "#cb5f48",
  flying: "#95a5a6",
  poison: "#9b59b6",
  ground: "#a0522d",
  rock: "#8e6e53",
  bug: "#94bc4a",
  ghost: "#6c5ce7",
  steel: "#7f8c8d"
};

export default function App() {
  const [grid, setGrid] = useState(emptyGrid);
  const [team, setTeam] = useState([]);
  const [box, setBox] = useState([]);
  const [pokemonList, setPokemonList] = useState([]);
  const [points, setPoints] = useState(0);
  const [selected, setSelected] = useState(null);

  const [showCatch, setShowCatch] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPokemon, setSelectedPokemon] = useState(null);

  const [globalDB, setGlobalDB] = useState({}); // 🔥 deine Datenbank

  const [customColor, setCustomColor] = useState("");
  const [pattern, setPattern] = useState("0");

  // Pokémon Liste laden
  useEffect(() => {
    fetch("https://pokeapi.co/api/v2/pokemon?limit=200")
      .then(res => res.json())
      .then(data => setPokemonList(data.results));
  }, []);

  // Vorschläge filtern
  const filtered = pokemonList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Pokémon fangen
  const catchPokemon = async () => {
    if (!selectedPokemon) return;

    const res = await fetch(selectedPokemon.url);
    const data = await res.json();

    let baseData = globalDB[data.name];

    // 🔥 Wenn noch nicht konfiguriert
    if (!baseData) {
      baseData = {
        color: customColor || typeColors[data.types[0].type.name],
        pattern: pattern.split(",").map(n => parseInt(n))
      };

      setGlobalDB(prev => ({
        ...prev,
        [data.name]: baseData
      }));
    }

    const newPokemon = {
      id: Date.now(),
      name: data.name,
      nickname: data.name,
      sprite: data.sprites.front_default,
      ...baseData
    };

    setBox(prev => [...prev, newPokemon]);

    // Reset
    setShowCatch(false);
    setSearch("");
    setSelectedPokemon(null);
  };

  const moveToTeam = (p) => {
    if (team.length >= 6) return;
    setTeam(prev => [...prev, p]);
    setBox(prev => prev.filter(x => x.id !== p.id));
  };

  const placeOnGrid = (index) => {
    if (!selected || grid[index]) return;

    const newGrid = [...grid];
    newGrid[index] = selected;
    setGrid(newGrid);
  };

  const addPoint = () => {
    if (points >= 3) return;
    setPoints(points + 1);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Pokemon Grid Challenge</h1>

      <h2>Punkte: {points}</h2>
      <button onClick={addPoint}>+ Punkt</button>

      {/* GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 80px)",
        gap: 5,
        marginTop: 20
      }}>
        {grid.map((cell, i) => (
          <div
            key={i}
            onClick={() => placeOnGrid(i)}
            style={{
              width: 80,
              height: 80,
              border: "1px solid black",
              background: cell ? cell.color : "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
          >
            {cell && cell.sprite && (
              <img src={cell.sprite} width={50} />
            )}
          </div>
        ))}
      </div>

      {/* TEAM */}
      <h2>Team</h2>
      {team.map((p) => (
        <div key={p.id} onClick={() => setSelected(p)}>
          <img src={p.sprite} width={40} />
          <span>{p.nickname}</span>
        </div>
      ))}

      {/* BOX */}
      <h2>Box</h2>
      {box.map((p) => (
        <div key={p.id}>
          <img src={p.sprite} width={40} />
          <span>{p.name}</span>
          <button onClick={() => moveToTeam(p)}>To Team</button>
        </div>
      ))}

      {/* 🔥 CATCH BUTTON */}
      <button onClick={() => setShowCatch(true)}>
        Catch Pokemon
      </button>

      {/* 🔥 MODAL */}
      {showCatch && (
        <div style={{
          border: "2px solid black",
          padding: 10,
          marginTop: 20
        }}>
          <h3>Pokemon suchen</h3>

          <input
            placeholder="Name eingeben..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div>
            {filtered.slice(0, 10).map(p => (
              <div
                key={p.name}
                onClick={() => setSelectedPokemon(p)}
                style={{ cursor: "pointer" }}
              >
                {p.name}
              </div>
            ))}
          </div>

          {selectedPokemon && (
            <>
              <h4>{selectedPokemon.name}</h4>

              {/* Farbe */}
              <input
                placeholder="Farbe (optional)"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
              />

              {/* Muster */}
              <input
                placeholder="Pattern z.B. 0,1,2"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
              />
            </>
          )}

          <button onClick={catchPokemon}>Bestätigen</button>
          <button onClick={() => setShowCatch(false)}>Abbrechen</button>
        </div>
      )}
    </div>
  );
}
