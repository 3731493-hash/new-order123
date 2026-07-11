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
  isLoading: boolean;
  onStart: () => void;
  onLeave: () => void;
};

export default function Lobby({
  roomCode,
  players,
  isHost,
  isLoading,
  onStart,
  onLeave,
}: LobbyProps) {
  async function copyRoomCode() {
    try {
      await navigator.clipboard.writeText(roomCode);
      alert("방 코드를 복사했습니다.");
    } catch {
      alert(`방 코드: ${roomCode}`);
    }
  }

  return (
    <main className="app-screen dark-theme">
      <section className="form-panel">
        <button
          type="button"
          className="back-button"
          onClick={onLeave}
          disabled={isLoading}
        >
          ← 방 나가기
        </button>

        <div className="section-number">WAITING ROOM</div>
        <p className="section-label">ROOM CODE</p>

        <h1 className="room-title">{roomCode}</h1>

        <button
          type="button"
          className="secondary-button"
          onClick={copyRoomCode}
        >
          방 코드 복사
        </button>

        <div className="lobby-heading">
          <h2>참가자</h2>
          <span>{players.length} / 8</span>
        </div>

        <div className="player-list">
          {players.map((player) => (
            <div className="player-row" key={player.id}>
              <div>
                <strong>
                  {player.isHost ? "👑 " : ""}
                  {player.name}
                </strong>

                <span>{player.rank}</span>
              </div>

              {player.isHost && <em>HOST</em>}
            </div>
          ))}
        </div>

        {isHost ? (
          <button
            type="button"
            className="primary-button"
            onClick={onStart}
            disabled={isLoading || players.length < 2}
          >
            {isLoading
              ? "게임 시작 중..."
              : players.length < 2
                ? "2명 이상 필요"
                : "게임 시작"}
          </button>
        ) : (
          <p className="lobby-waiting-message">
            방장이 게임을 시작할 때까지 기다려주세요.
          </p>
        )}
      </section>
    </main>
  );
}