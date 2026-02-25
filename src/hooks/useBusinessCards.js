import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
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
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCard = async (cardData) => {
    if (!user) throw new Error('Must be logged in to create cards');

    try {
      const cardsRef = collection(db, 'users', user.uid, 'cards');
      const docRef = await addDoc(cardsRef, {
        ...cardData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await loadCards();
      return docRef.id;
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
      const cardRef = doc(db, 'users', user.uid, 'cards', cardId);
      await deleteDoc(cardRef);

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
