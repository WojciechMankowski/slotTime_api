import { api } from "./api";
import { DokTyp } from "../Types/DokType";

/**
 * Pobiera listę dokumentów dla administratora.
 * Zwraca obietnicę z tablicą obiektów typu DokTyp.
 */
export const getDokAdmin = async (): Promise<DokTyp[]> => {
  try {
    const res = await api.get<DokTyp[]>("/api/docks");
    return res.data;
  } catch (error) {
    // Logowanie błędu w celach debugowania
    console.error("Błąd podczas pobierania dokumentów admina:", error);
    
    // Opcjonalnie: wyrzucenie błędu dalej, aby obsłużyć go w UI
    throw error;
  }
};