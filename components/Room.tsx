"use client";

type RoomProps = {
  nickname: string;
  onCreate: () => void;
  onJoin: () => void;
  onBack: () => void;
};

export default function Room({
  nickname,
  onCreate,
  onJoin,
  onBack,
}: RoomProps) {
  return (
    <main className="app-screen dark-theme">
      <section className="form-panel">

        <button
          className="back-button"
          onClick={onBack}
        >
          ← BACK
        </button>

        <div className="section-number">
          02
        </div>

        <p className="section-label">
          SELECT MODE
        </p>

        <h1 className="room-title">
          환영합니다.
          <br />
          <span>{nickname}</span>
        </h1>

        <p className="form-description">
          새로운 방을 만들거나
          <br />
          친구의 방에 참가하세요.
        </p>

        <div className="room-actions">

          <button
            className="primary-button"
            onClick={onCreate}
          >
            방 만들기
          </button>

          <button
            className="secondary-button"
            onClick={onJoin}
          >
            방 참가
          </button>

        </div>

      </section>
    </main>
  );
}