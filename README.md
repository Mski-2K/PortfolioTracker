# Portfolio Manager

Prosty system do zarządzania portfelem inwestycyjnym (np. z XTB), który wizualizuje wartość portfela w czasie w wybranej walucie.

## Funkcje

- Dodawanie transakcji kupna/sprzedaży dla dowolnego instrumentu (np. AAPL, MSFT itp.)
- Wybór globalnej waluty portfela (PLN, USD, EUR, GBP) w prawym górnym rogu
- Wszystkie kwoty transakcji podajesz w wybranej walucie portfela
- Automatyczne przeliczanie na walutę instrumentu po kursie NBP z dnia transakcji
- Wykres wartości portfela w czasie (tygodnie/miesiące/kwartały) w wybranej walucie
- Bieżąca wycena i przeliczanie walutowe portfela
- Obliczanie zysków kapitałowych i walutowych na podstawie rzeczywistych kursów NBP
- Integracja z MongoDB do przechowywania danych

## Wymagania

- Node.js (v14 lub nowszy)
- MongoDB
- npm lub yarn

## Instalacja

1. Sklonuj repozytorium
2. Zainstaluj zależności:
```bash
npm install
```

3. Utwórz plik `.env` w katalogu głównym z następującymi zmiennymi:
```
MONGODB_URI=tu_wstaw_swoj_mongo_db_uri
PORT=3000
ALPHA_VANTAGE_API_KEY=tu_wstaw_swoj_klucz_api
```

## Uruchomienie aplikacji

Tryb deweloperski:
```bash
npm run dev
```

Tryb produkcyjny:
```bash
npm start
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`

## Użytkowanie

1. Wybierz walutę portfela w prawym górnym rogu (domyślnie: PLN)
2. Dodawaj transakcje przez formularz (kwota zawsze w wybranej walucie portfela)
3. Przeglądaj wykres wartości portfela w czasie (wybierz tydzień/miesiąc/kwartał)
4. Wszystkie przeliczenia i wyceny są automatyczne (kursy NBP, ceny Yahoo Finance)

## Integracje API

- API NBP do pobierania kursów walut
- Yahoo Finance do pobierania historycznych i bieżących cen akcji

## Licencja

MIT 