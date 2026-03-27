import { useState, useEffect } from "react";

const emptyGrid = Array(9).fill(null);

export default function App() {
  const [grid, setGrid] = useState(emptyGrid);
  const [team, setTeam] = useState([]);
  const [box, setBox] = useState([]);
  const [pokemonList, setPokemonList] = useState([]);
  const [selected, setSelected] = useState(null);

  // 🔥 Pokémon laden
  useEffect(() => {
    fetch("https://pokeapi.co/api/v2/pokemon?limit=50")
      .then(res => res.json())
      .then(data => setPokemonList(data.results));
  }, []);

  // 🧩 Platz prüfen
  const canPlace = (pattern, startIndex) => {
    return pattern.every(p => {
      const pos = startIndex + p;
      return pos < 9 && !grid[pos];
    });
  };

  // 🧩 Platzieren
  const placeOnGrid = (index) => {
    if (!selected) return;
    if (!canPlace(selected.pattern, index)) return;

    const newGrid = [...grid];

    selected.pattern.forEach(p => {
      const pos = index + p;
      newGrid[pos] = selected.id;
    });

    setGrid(newGrid);
  };

  // ❌ Entfernen
  const removePokemonFromGrid = (pokemonId) => {
    const newGrid = grid.map(cell =>
      cell === pokemonId ? null : cell
    );
    setGrid(newGrid);
  };

  // Pokémon fangen (vereinfachte Version)
  const catchPokemon = async (pokemon) => {
    const res = await fetch(pokemon.url);
    const data = await res.json();

    const newPokemon = {
      id: Date.now(),
      name: data.name,
      sprite: data.sprites.front_default,
      pattern: [0, 1] // 🔥 TEST-MUSTER
    };

    setBox(prev => [...prev, newPokemon]);
  };

  const moveToTeam = (p) => {
    if (team.length >= 6) return;
    setTeam(prev => [...prev, p]);
    setBox(prev => prev.filter(x => x.id !== p.id));
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Pokemon Grid</h1>

      {/* GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 80px)",
        gap: 5
      }}>
        {grid.map((cell, i) => (
          <div
            key={i}
            onClick={() => {
              if (cell) {
                removePokemonFromGrid(cell);
              } else {
                placeOnGrid(i);
              }
            }}
            style={{
              width: 80,
              height: 80,
              border: "1px solid black",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
          >
            {cell && "■"}
          </div>
        ))}
      </div>

      {/* TEAM */}
      <h2>Team (klicken zum auswählen)</h2>
      {team.map((p) => (
        <div key={p.id} onClick={() => setSelected(p)}>
          <img src={p.sprite} width={40} />
          <span>{p.name}</span>
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

      {/* Pokémon fangen */}
      <h2>Catch Pokemon</h2>
      {pokemonList.map((p) => (
        <button key={p.name} onClick={() => catchPokemon(p)}>
          {p.name}
        </button>
      ))}
    </div>
  );
}
