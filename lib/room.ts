import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { ensureAnonymousUser } from "./auth";
import { db } from "./firebase";

export type Player = {
  id: string;
  accountId: string;
  name: string;
  isHost: boolean;
  rank: string;
};

export type SavedUser = {
  uid: string;
  playerId: string;
  nickname: string;
  currentRoomCode: string;
};

const MAX_PLAYERS = 8;

/* 6자리 방 코드 생성 */
export function createRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  return Array.from({ length: 6 }, () => {
    return chars[Math.floor(Math.random() * chars.length)];
  }).join("");
}

/*
 * 현재 기기에서 사용하는 플레이어 ID.
 * page.tsx와의 기존 연결을 유지하기 위해 남겨둔다.
 */
export function getPlayerId() {
  const savedId = localStorage.getItem("new-order-player-id");

  if (savedId) {
    return savedId;
  }

  const newId = crypto.randomUUID();

  localStorage.setItem("new-order-player-id", newId);

  return newId;
}

/* 이미 존재하지 않는 방 코드 찾기 */
async function createUniqueRoomCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = createRoomCode();
    const roomSnapshot = await getDoc(doc(db, "rooms", code));

    if (!roomSnapshot.exists()) {
      return code;
    }
  }

  throw new Error("ROOM_CODE_GENERATION_FAILED");
}

/* 새 방 만들기 */
export async function createRoom(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("INVALID_NAME");
  }

  const user = await ensureAnonymousUser();
  const accountId = user.uid;

  const code = await createUniqueRoomCode();
  const playerId = getPlayerId();

  await setDoc(doc(db, "rooms", code), {
    code,
    status: "waiting",
    hostId: playerId,
    hostAccountId: accountId,
    maxPlayers: MAX_PLAYERS,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, "rooms", code, "players", playerId), {
    id: playerId,
    accountId,
    name: trimmedName,
    rank: "이병",
    isHost: true,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  /*
   * 사용자의 현재 방 저장.
   * 앱을 다시 열 때 이 값을 읽어 기존 방으로 복귀할 수 있다.
   */
  await setDoc(
    doc(db, "users", accountId),
    {
      uid: accountId,
      playerId,
      nickname: trimmedName,
      currentRoomCode: code,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  localStorage.setItem("new-order-nickname", trimmedName);
  localStorage.setItem("new-order-room-code", code);

  return code;
}

/* 기존 방 참가 */
export async function joinRoom(code: string, name: string) {
  const normalizedCode = code.trim().toUpperCase();
  const trimmedName = name.trim();

  if (!normalizedCode) {
    throw new Error("INVALID_ROOM_CODE");
  }

  if (!trimmedName) {
    throw new Error("INVALID_NAME");
  }

  const user = await ensureAnonymousUser();
  const accountId = user.uid;
  const playerId = getPlayerId();

  const roomRef = doc(db, "rooms", normalizedCode);
  const roomSnapshot = await getDoc(roomRef);

  if (!roomSnapshot.exists()) {
    throw new Error("ROOM_NOT_FOUND");
  }

  const roomData = roomSnapshot.data();

  if (roomData.status !== "waiting") {
    throw new Error("GAME_ALREADY_STARTED");
  }

  const playersRef = collection(
    db,
    "rooms",
    normalizedCode,
    "players",
  );

  const playersSnapshot = await getDocs(playersRef);

  const alreadyJoined = playersSnapshot.docs.some(
    (playerDocument) => playerDocument.id === playerId,
  );

  if (!alreadyJoined && playersSnapshot.size >= MAX_PLAYERS) {
    throw new Error("ROOM_FULL");
  }

  const isHost =
    roomData.hostId === playerId ||
    roomData.hostAccountId === accountId;

  await setDoc(
    doc(db, "rooms", normalizedCode, "players", playerId),
    {
      id: playerId,
      accountId,
      name: trimmedName,
      rank: "이병",
      isHost,
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await setDoc(
    doc(db, "users", accountId),
    {
      uid: accountId,
      playerId,
      nickname: trimmedName,
      currentRoomCode: normalizedCode,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  localStorage.setItem("new-order-nickname", trimmedName);
  localStorage.setItem(
    "new-order-room-code",
    normalizedCode,
  );

  return normalizedCode;
}

/* 현재 계정에 저장된 방 정보 불러오기 */
export async function getSavedUser() {
  const user = await ensureAnonymousUser();

  const userSnapshot = await getDoc(
    doc(db, "users", user.uid),
  );

  if (!userSnapshot.exists()) {
    return null;
  }

  return userSnapshot.data() as SavedUser;
}

/* 저장된 방이 아직 존재하는지 확인 */
export async function getSavedRoom() {
  const savedUser = await getSavedUser();

  if (!savedUser?.currentRoomCode) {
    return null;
  }

  const normalizedCode =
    savedUser.currentRoomCode.trim().toUpperCase();

  const roomSnapshot = await getDoc(
    doc(db, "rooms", normalizedCode),
  );

  if (!roomSnapshot.exists()) {
    return null;
  }

  return {
    roomCode: normalizedCode,
    nickname: savedUser.nickname,
    playerId: savedUser.playerId,
  };
}

/* 참가자 목록 실시간 구독 */
export function subscribePlayers(
  roomCode: string,
  callback: (players: Player[]) => void,
  onError?: (error: Error) => void,
) {
  const normalizedCode = roomCode.trim().toUpperCase();

  if (!normalizedCode) {
    throw new Error("INVALID_ROOM_CODE");
  }

  const playersRef = collection(
    db,
    "rooms",
    normalizedCode,
    "players",
  );

  return onSnapshot(
    playersRef,
    (snapshot) => {
      const players = snapshot.docs.map(
        (playerDocument) => {
          return playerDocument.data() as Player;
        },
      );

      players.sort((first, second) => {
        if (first.isHost !== second.isHost) {
          return first.isHost ? -1 : 1;
        }

        return first.name.localeCompare(
          second.name,
          "ko",
        );
      });

      callback(players);
    },
    (error) => {
      console.error("플레이어 구독 오류:", error);

      if (onError) {
        onError(error);
      }
    },
  );
}