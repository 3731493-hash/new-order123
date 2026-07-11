import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { ensureAnonymousUser } from "./auth";
import { db } from "./firebase";

export type Player = {
  id: string;
  accountId?: string;
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

export type RoomData = {
  code: string;
  status: "waiting" | "playing";
  hostId: string;
  hostAccountId?: string;
  maxPlayers: number;
};

const MAX_PLAYERS = 8;

/* 6자리 방 코드 만들기 */
export function createRoomCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  return Array.from({ length: 6 }, () => {
    const randomIndex = Math.floor(
      Math.random() * characters.length,
    );

    return characters[randomIndex];
  }).join("");
}

/* 현재 휴대폰·브라우저에서 사용하는 플레이어 ID */
export function getPlayerId() {
  const savedId = localStorage.getItem(
    "new-order-player-id",
  );

  if (savedId) {
    return savedId;
  }

  const newId = crypto.randomUUID();

  localStorage.setItem("new-order-player-id", newId);

  return newId;
}

/* 중복되지 않는 방 코드 찾기 */
async function createUniqueRoomCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = createRoomCode();

    const roomSnapshot = await getDoc(
      doc(db, "rooms", code),
    );

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
  const playerId = getPlayerId();
  const code = await createUniqueRoomCode();

  await setDoc(doc(db, "rooms", code), {
    code,
    status: "waiting",
    hostId: playerId,
    hostAccountId: accountId,
    maxPlayers: MAX_PLAYERS,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, "rooms", code, "players", playerId),
    {
      id: playerId,
      accountId,
      name: trimmedName,
      rank: "이병",
      isHost: true,
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );

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

  localStorage.setItem(
    "new-order-nickname",
    trimmedName,
  );

  localStorage.setItem(
    "new-order-room-code",
    code,
  );

  return code;
}

/* 기존 방 참가하기 */
export async function joinRoom(
  code: string,
  name: string,
) {
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

  const roomRef = doc(
    db,
    "rooms",
    normalizedCode,
  );

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
    (playerDocument) =>
      playerDocument.id === playerId,
  );

  if (
    !alreadyJoined &&
    playersSnapshot.size >= MAX_PLAYERS
  ) {
    throw new Error("ROOM_FULL");
  }

  const isHost =
    roomData.hostId === playerId ||
    roomData.hostAccountId === accountId;

  await setDoc(
    doc(
      db,
      "rooms",
      normalizedCode,
      "players",
      playerId,
    ),
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

  localStorage.setItem(
    "new-order-nickname",
    trimmedName,
  );

  localStorage.setItem(
    "new-order-room-code",
    normalizedCode,
  );

  return normalizedCode;
}

/* 현재 계정에 저장된 정보 불러오기 */
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

/* 마지막으로 참여했던 방 불러오기 */
export async function getSavedRoom() {
  const savedUser = await getSavedUser();

  if (!savedUser?.currentRoomCode) {
    return null;
  }

  const normalizedCode =
    savedUser.currentRoomCode
      .trim()
      .toUpperCase();

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
    status: roomSnapshot.data().status as
      | "waiting"
      | "playing",
  };
}

/* 참가자 목록 실시간 확인 */
export function subscribePlayers(
  roomCode: string,
  callback: (players: Player[]) => void,
  onError?: (error: Error) => void,
) {
  const normalizedCode =
    roomCode.trim().toUpperCase();

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
        (playerDocument) =>
          playerDocument.data() as Player,
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
      console.error(
        "플레이어 구독 오류:",
        error,
      );

      onError?.(error);
    },
  );
}

/* 방 상태 실시간 확인 */
export function subscribeRoom(
  roomCode: string,
  callback: (room: RoomData | null) => void,
  onError?: (error: Error) => void,
) {
  const normalizedCode =
    roomCode.trim().toUpperCase();

  if (!normalizedCode) {
    throw new Error("INVALID_ROOM_CODE");
  }

  const roomRef = doc(
    db,
    "rooms",
    normalizedCode,
  );

  return onSnapshot(
    roomRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback(snapshot.data() as RoomData);
    },
    (error) => {
      console.error(
        "방 상태 구독 오류:",
        error,
      );

      onError?.(error);
    },
  );
}

/* 방장이 게임 시작 */
export async function startGame(
  roomCode: string,
) {
  const normalizedCode =
    roomCode.trim().toUpperCase();

  if (!normalizedCode) {
    throw new Error("INVALID_ROOM_CODE");
  }

  const user = await ensureAnonymousUser();
  const playerId = getPlayerId();

  const roomRef = doc(
    db,
    "rooms",
    normalizedCode,
  );

  const roomSnapshot = await getDoc(roomRef);

  if (!roomSnapshot.exists()) {
    throw new Error("ROOM_NOT_FOUND");
  }

  const roomData = roomSnapshot.data();

  const isHost =
    roomData.hostId === playerId ||
    roomData.hostAccountId === user.uid;

  if (!isHost) {
    throw new Error("NOT_HOST");
  }

  if (roomData.status !== "waiting") {
    throw new Error("GAME_ALREADY_STARTED");
  }

  const playersSnapshot = await getDocs(
    collection(
      db,
      "rooms",
      normalizedCode,
      "players",
    ),
  );

  if (playersSnapshot.size < 2) {
    throw new Error("NOT_ENOUGH_PLAYERS");
  }

  await updateDoc(roomRef, {
    status: "playing",
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/* 방 나가기 */
export async function leaveRoom(
  roomCode: string,
) {
  const normalizedCode =
    roomCode.trim().toUpperCase();

  if (!normalizedCode) {
    throw new Error("INVALID_ROOM_CODE");
  }

  const user = await ensureAnonymousUser();
  const playerId = getPlayerId();

  const roomRef = doc(
    db,
    "rooms",
    normalizedCode,
  );

  const playerRef = doc(
    db,
    "rooms",
    normalizedCode,
    "players",
    playerId,
  );

  const roomSnapshot = await getDoc(roomRef);

  if (roomSnapshot.exists()) {
    const roomData = roomSnapshot.data();

    const playersSnapshot = await getDocs(
      collection(
        db,
        "rooms",
        normalizedCode,
        "players",
      ),
    );

    const otherPlayers = playersSnapshot.docs
      .filter(
        (playerDocument) =>
          playerDocument.id !== playerId,
      )
      .map(
        (playerDocument) =>
          playerDocument.data() as Player,
      );

    await deleteDoc(playerRef);

    const wasHost =
      roomData.hostId === playerId ||
      roomData.hostAccountId === user.uid;

    if (wasHost) {
      const nextHost = otherPlayers[0];

      if (nextHost) {
        await updateDoc(roomRef, {
          hostId: nextHost.id,
          hostAccountId:
            nextHost.accountId ?? "",
          updatedAt: serverTimestamp(),
        });

        await updateDoc(
          doc(
            db,
            "rooms",
            normalizedCode,
            "players",
            nextHost.id,
          ),
          {
            isHost: true,
            updatedAt: serverTimestamp(),
          },
        );
      } else {
        await deleteDoc(roomRef);
      }
    }
  }

  await setDoc(
    doc(db, "users", user.uid),
    {
      currentRoomCode: "",
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  localStorage.removeItem(
    "new-order-room-code",
  );
}