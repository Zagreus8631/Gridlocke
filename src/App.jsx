{showCatch && (
  <div style={{ marginTop: 20 }}>
    <h3>Catch Pokemon</h3>

    <input
      placeholder="Suche..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />

    {filtered.slice(0, 10).map(p => (
      <div
        key={p.name}
        style={{ cursor: "pointer" }}
        onClick={() => setSelectedPokemon(p)}
      >
        {p.name}
      </div>
    ))}

    {/* Pattern Editor */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,40px)", marginTop: 10 }}>
      {pattern.map((val, i) => (
        <div
          key={i}
          onClick={() => {
            const newP = [...pattern];
            newP[i] = !newP[i];
            setPattern(newP);
          }}
          style={{
            width: 40,
            height: 40,
            background: val ? "black" : "#eee",
            border: "1px solid black",
            cursor: "pointer"
          }}
        />
      ))}
    </div>

    <input
      placeholder="Nickname"
      value={nickname}
      onChange={(e) => setNickname(e.target.value)}
    />

    <button onClick={catchPokemon}>Catch</button>
  </div>
)}
