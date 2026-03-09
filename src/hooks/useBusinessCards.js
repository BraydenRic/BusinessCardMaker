import { useState, useEffect } from 'react';
import {
  collection,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
  runTransaction,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

export const useBusinessCards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCards();
    } else {
      setCards([]);
      setLoading(false);
    }
  }, [user]);

  const MAX_CARDS = 25;

  const loadCards = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const cardsRef = collection(db, 'users', user.uid, 'cards');
      const q = query(cardsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const loadedCards = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCards(loadedCards);

      // Sync counter on first load after migration (one-time write if counter is missing)
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists() || userDoc.data().cardCount === undefined) {
        await setDoc(userRef, { cardCount: loadedCards.length }, { merge: true });
      }
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCard = async (cardData) => {
    if (!user) throw new Error('Must be logged in to create cards');

    try {
      const userRef = doc(db, 'users', user.uid);
      const newCardRef = doc(collection(db, 'users', user.uid, 'cards'));

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const currentCount = userDoc.exists() ? (userDoc.data().cardCount ?? 0) : 0;

        if (currentCount >= MAX_CARDS) {
          throw new Error(`Card limit reached (${MAX_CARDS} max). Please delete a card before creating a new one.`);
        }

        transaction.set(userRef, { cardCount: currentCount + 1 }, { merge: true });
        transaction.set(newCardRef, {
          ...cardData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await loadCards();
      return newCardRef.id;
    } catch (error) {
      console.error('Error creating card:', error);
      throw error;
    }
  };

  const updateCard = async (cardId, cardData) => {
    if (!user) throw new Error('Must be logged in to update cards');

    try {
      const cardRef = doc(db, 'users', user.uid, 'cards', cardId);
      await updateDoc(cardRef, {
        ...cardData,
        updatedAt: serverTimestamp()
      });

      await loadCards();
    } catch (error) {
      console.error('Error updating card:', error);
      throw error;
    }
  };

  const deleteCard = async (cardId) => {
    if (!user) throw new Error('Must be logged in to delete cards');

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'users', user.uid, 'cards', cardId));
      // Decrement counter atomically with the delete so they never drift out of sync
      batch.update(doc(db, 'users', user.uid), { cardCount: increment(-1) });
      await batch.commit();

      await loadCards();
    } catch (error) {
      console.error('Error deleting card:', error);
      throw error;
    }
  };

  return {
    cards,
    loading,
    createCard,
    updateCard,
    deleteCard,
    refreshCards: loadCards
  };
};
