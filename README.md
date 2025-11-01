# Midi Connect Portal - MIDI Kontrola

Ova web stranica omogućava upravljanje MIDI uređajima direktno iz web preglednika koristeći Web MIDI API.

## Funkcionalnosti

### Osnovne funkcije
- **Povezivanje s MIDI uređajima** - Automatsko otkrivanje i povezivanje s dostupnim MIDI ulazima i izlazima
- **MIDI Monitor** - Praćenje svih MIDI poruka u realnom vremenu
- **Osnovne kontrole** - Sviranje nota, zaustavljanje svih tonova, promjena programa

### Napredne funkcije
- **Virtualno Piano** - Interaktivno piano s mišem i tipkovnicom
- **Kontrola glasnoće** - Real-time kontrola glasnoće, pana i reverb efekta
- **Program i kanal kontrola** - Promjena MIDI programa i kanala
- **MIDI File Playback** - Učitavanje i reprodukcija MIDI datoteka

## Kako koristiti

### 1. Povezivanje s MIDI uređajem

1. Otvorite stranicu u web pregledniku koji podržava Web MIDI API (Chrome, Edge, Firefox)
2. Kliknite "Poveži MIDI uređaj"
3. Odaberite željeni MIDI ulaz i izlaz iz padajućih izbornika
4. Status indikator će pokazati "Povezano" kada je veza uspostavljena

### 2. Virtualno Piano

- **Miš**: Kliknite na tipke za sviranje nota
- **Tipkovnica**: Koristite tipke A-K za bijele tipke, W-U za crne tipke
- **Mapiranje tipki**:
  - A = C, W = C#, S = D, E = D#, D = E, F = F, T = F#
  - G = G, Y = G#, H = A, U = A#, J = B, K = C

### 3. Kontrole

#### Glasnoća, Pan i Reverb
- Povucite klizače za kontrolu različitih parametara
- Promjene se šalju u realnom vremenu na MIDI uređaj

#### Program i Kanal
- Postavite željeni program (0-127) i kanal (1-16)
- Kliknite "Primijeni program" za promjenu

#### MIDI File Playback
1. Kliknite na područje za upload datoteke
2. Odaberite MIDI datoteku (.mid ili .midi)
3. Koristite Play/Pause/Stop gumbe za kontrolu reprodukcije

## Tehnički zahtjevi

### Web preglednici
- **Chrome** 43+ (preporučeno)
- **Edge** 79+
- **Firefox** 108+
- **Safari** 16.4+

### MIDI uređaji
- Bilo koji MIDI uređaj s USB konekcijom
- Virtualni MIDI uređaji (loopMIDI, rtpMIDI, itd.)
- MIDI interface za klavijature

## MIDI poruke koje se podržavaju

### Note poruke
- **Note On** (0x90) - Početak sviranja note
- **Note Off** (0x80) - Kraj sviranja note

### Control Change poruke
- **Volume** (CC 7) - Kontrola glasnoće
- **Pan** (CC 10) - Kontrola stereo pozicije
- **Reverb** (CC 91) - Kontrola reverb efekta

### Program Change poruke
- **Program Change** (0xC0) - Promjena zvuka/instrumenta

## Struktura datoteka

```
├── index.html              # Glavna stranica s osnovnim MIDI kontrolama
├── midi-control.html       # Napredna MIDI kontrola stranica
├── midi-controller.js      # Osnovni MIDI kontroler
├── midi-advanced.js        # Napredni MIDI kontroler
├── styles.css              # CSS stilovi
└── README.md               # Ova datoteka
```

## Rješavanje problema

### MIDI uređaj se ne pojavljuje
1. Provjerite je li uređaj pravilno povezan
2. Provjerite podržava li preglednik Web MIDI API
3. Pokušajte osvježiti stranicu

### Nema zvuka
1. Provjerite je li odabran ispravan MIDI izlaz
2. Provjerite glasnoću na MIDI uređaju
3. Provjerite je li MIDI uređaj uključen

### Virtualno piano ne radi
1. Provjerite je li MIDI uređaj povezan
2. Provjerite je li odabran MIDI izlaz
3. Pokušajte koristiti tipkovnicu umjesto miša

## Sigurnost

- Web MIDI API zahtijeva korisničku dozvolu za pristup MIDI uređajima
- Stranica ne šalje MIDI podatke na vanjske servere
- Svi MIDI podaci se obrađuju lokalno u pregledniku

## Podrška

Za tehničku podršku ili pitanja, kontaktirajte:
- Email: gogic37@gmail.com
- Facebook: [Midi Connect Portal](https://www.facebook.com/groups/330748004039789)
- YouTube: [@gogic37](https://www.youtube.com/@gogic37/videos)

## Licenca

© 2025 Midi Connect Portal. Sva prava pridržana. 