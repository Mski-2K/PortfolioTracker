# Portfolio Manager

## Sprawozdanie z projektu

### Opis projektu
Portfolio Manager to aplikacja webowa służąca do zarządzania portfelem inwestycyjnym. Pozwala na rejestrowanie transakcji kupna i sprzedaży akcji (lub innych instrumentów), automatyczne przeliczanie wartości portfela w wybranej walucie oraz wizualizację zmian wartości portfela w czasie. System korzysta z rzeczywistych kursów walut NBP oraz cen akcji z Yahoo Finance.

### Założenia i cele
- Użytkownik może wybrać globalną walutę portfela (PLN, USD, EUR, GBP).
- Wszystkie kwoty transakcji są podawane w tej walucie, niezależnie od waluty instrumentu.
- System automatycznie przelicza kwotę na walutę instrumentu po kursie NBP z dnia transakcji.
- Wartość portfela jest zawsze prezentowana w wybranej walucie portfela.
- Wykres wartości portfela pokazuje zmiany w czasie (tygodnie/miesiące/kwartały).
- System obsługuje zarówno zyski kapitałowe, jak i walutowe.

### Architektura i technologie
- **Backend:** Node.js + Express
- **Frontend:** EJS (szablony), Bootstrap, Chart.js
- **Baza danych:** MongoDB (przechowywanie transakcji)
- **API zewnętrzne:**
  - Yahoo Finance (ceny akcji)
  - NBP (kursy walut)

### Najważniejsze funkcje
- Dodawanie transakcji kupna/sprzedaży z automatycznym przeliczeniem walut
- Wybór waluty portfela (globalnie dla całej aplikacji)
- Przeliczanie wartości portfela na wybraną walutę na podstawie kursów NBP
- Wykres wartości portfela w czasie (z wyborem przedziału: tydzień, miesiąc, kwartał)
- Obsługa różnych walut instrumentów (PLN, USD, EUR, GBP)
- FIFO przy rozliczaniu sprzedaży akcji
- Obsługa braku kursów NBP/cen akcji (cache ostatniego znanego kursu/ceny)

### Napotkane problemy i ich rozwiązania
- **Przeliczanie walut:** Początkowo logika przeliczania była błędna (mnożenie zamiast dzielenia przez kurs), co prowadziło do zawyżonych ilości akcji. Poprawiono na dzielenie przez kurs NBP.
- **Brak kursów/cen z danego dnia:** Gdy NBP lub Yahoo Finance nie zwracały danych z danego dnia (weekendy, święta), wartości były zaniżone. Rozwiązano przez szukanie najnowszego dostępnego kursu/ceny wstecz oraz cache ostatniego znanego kursu.
- **Zgodność walut:** Ujednolicono logikę, by wszystkie wartości były zawsze przeliczane na wybraną walutę portfela.
- **Wizualizacja:** Wprowadzono wykres wartości portfela w czasie, zamiast tylko zrealizowanych zysków.

---

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