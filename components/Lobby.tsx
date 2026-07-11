"use client";

type Player = {
  id: string;
  name: string;
  isHost: boolean;
  rank: string;
};

type LobbyProps = {
  roomCode: string;
  players: Player[];
  isHost: boolean;
};

export default function Lobby({
  roomCode,
  players,
  isHost,
}: LobbyProps) {
  return (
    <main className="app-screen dark-theme">
      <section className="form-panel">

        <div className="section-number">
          ROOM
        </div>

        <p className="section-label">
          ROOM CODE
        </p>

        <h1 className="room-title">
          {roomCode}
        </h1>

        <p className="form-description">
          친구에게 위 코드를 알려주세요.
        </p>

        <div
          style={{
            marginTop: 30,
            borderTop: "1px solid #333",
            borderBottom: "1px solid #333",
          }}
        >
          {players.map((player) => (
            <div
              key={player.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 0",
              }}
            >
              <span>
                {player.isHost ? "👑 " : ""}
                {player.name}
              </span>

              <span>{player.rank}</span>
            </div>
          ))}
        </div>

        {isHost && (
          <button
            className="primary-button"
            style={{ marginTop: 30 }}
          >
            게임 시작
          </button>
        )}

      </section>
    </main>
  );
}