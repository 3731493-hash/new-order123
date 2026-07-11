"use client";

type Player = {
  id: string;
  name: string;
  isHost: boolean;
  rank: string;
};

type GameProps = {
  roomCode: string;
  player?: Player;
  playerCount: number;
  onLeave: () => void;
};

export default function Game({
  roomCode,
  player,
  playerCount,
  onLeave,
}: GameProps) {
  return (
    <main className="app-screen dark-theme">
      <section className="form-panel">
        <button
          type="button"
          className="back-button"
          onClick={onLeave}
        >
          ← 게임 나가기
        </button>

        <div className="section-number">GAME STARTED</div>
        <p className="section-label">ROOM {roomCode}</p>

        <h1 className="room-title">
          게임이
          <br />
          시작되었습니다.
        </h1>

        <p className="form-description">
          현재 참가자 {playerCount}명
        </p>

        <div className="game-player-card">
          <span>나의 계급</span>
          <strong>{player?.rank ?? "이병"}</strong>
          <p>{player?.name ?? "플레이어"}</p>
        </div>

        <p className="lobby-waiting-message">
          다음 단계에서 미니게임과 계급 시스템을 연결합니다.
        </p>
      </section>
    </main>
  );
}