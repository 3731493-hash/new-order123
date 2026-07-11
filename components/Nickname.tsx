"use client";

import { useState } from "react";

type NicknameProps = {
  onBack: () => void;
  onComplete: (nickname: string) => void;
};

export default function Nickname({
  onBack,
  onComplete,
}: NicknameProps) {
  const [nickname, setNickname] = useState("");

  function submit() {
    const name = nickname.trim();

    if (!name) {
      alert("이름을 입력해주세요.");
      return;
    }

    localStorage.setItem("new-order-nickname", name);

    onComplete(name);
  }

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
          01
        </div>

        <p className="section-label">
          PLAYER REGISTRATION
        </p>

        <h1 className="form-title">
          참가자 이름을
          <br />
          입력하세요.
        </h1>

        <p className="form-description">
          친구들에게 표시될 이름입니다.
        </p>

        <input
          className="nickname-input"
          placeholder="닉네임"
          maxLength={10}
          autoFocus
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              submit();
            }
          }}
        />

        <button
          className="primary-button"
          onClick={submit}
        >
          계속하기
        </button>

      </section>
    </main>
  );
}