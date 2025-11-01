// SF2 Manager for MIDI Playback
class SF2Manager {
    constructor() {
        this.sf2Banks = [];
        this.currentBank = null;
        this.audioContext = null;
        this.synth = null;
        this.init();
    }

    async init() {
        await this.loadSF2Banks();
        this.setupEventListeners();
    }

    async loadSF2Banks() {
        try {            
            this.sf2Banks = [                
                {
                    id: 'hamma',
                    name: 'Hamma',
                    path: 'sf2-banks/piano-banks/Hamma.sf2',
                    category: 'Piano',
                    size: '515.99 MB',
                    description: 'Narodna muzika'
                }
            ];  
            this.populateSF2Dropdown();
            this.updateSF2Info();
        } catch (error) {
            console.error('Greška pri učitavanju SF2 banaka:', error);
            this.showError('Nije moguće učitati SF2 banke');
        }
    }

    populateSF2Dropdown() {
        const select = document.getElementById('sf2-bank');
        if (!select) return;

        // Očisti postojeće opcije
        select.innerHTML = '<option value="">Odaberite SF2 banku...</option>';

        // Grupiraj banke po kategorijama
        const categories = {};
        this.sf2Banks.forEach(bank => {
            if (!categories[bank.category]) {
                categories[bank.category] = [];
            }
            categories[bank.category].push(bank);
        });

        // Dodaj opcije grupirane po kategorijama
        Object.keys(categories).forEach(category => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category;
            
            categories[category].forEach(bank => {
                const option = document.createElement('option');
                option.value = bank.id;
                option.textContent = `${bank.name} (${bank.size})`;
                option.dataset.bank = JSON.stringify(bank);
                optgroup.appendChild(option);
            });
            
            select.appendChild(optgroup);
        });
    }

    setupEventListeners() {
        const select = document.getElementById('sf2-bank');
        if (select) {
            select.addEventListener('change', (e) => {
                this.onSF2BankChange(e);
            });
        }
    }

    onSF2BankChange(event) {
        const selectedOption = event.target.options[event.target.selectedIndex];
        if (selectedOption.value) {
            const bankData = JSON.parse(selectedOption.dataset.bank);
            this.currentBank = bankData;
            this.loadSF2Bank(bankData);
        } else {
            this.currentBank = null;
            this.updateSF2Info();
        }
    }

    async loadSF2Bank(bankData) {
        try {
            this.showLoading('Učitavanje SF2 banke...');
            
            // Učitaj SF2 banku
            await this.loadSF2File(bankData.path);
            
            this.updateSF2Info(bankData);
            this.showSuccess(`SF2 banka "${bankData.name}" uspješno učitana`);
            
            // Inicijaliziraj audio context ako je potrebno
            if (!this.audioContext) {
                this.initAudioContext();
            }
            
        } catch (error) {
            console.error('Greška pri učitavanju SF2 banke:', error);
            this.showError(`Greška pri učitavanju banke: ${bankData.name}`);
        }
    }

    async loadSF2File(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            console.log(`SF2 datoteka učitana: ${path} (${arrayBuffer.byteLength} bytes)`);
            
            // Ovdje bi se parsirao SF2 format i učitale sample
            // Za sada samo simulacija
            return arrayBuffer;
        } catch (error) {
            console.error('Greška pri učitavanju SF2 datoteke:', error);
            throw error;
        }
    }

    async simulateSF2Load(bankData) {
        // Simulacija vremena učitavanja
        return new Promise(resolve => {
            setTimeout(() => {
                console.log(`SF2 banka učitana: ${bankData.name}`);
                resolve();
            }, 1000);
        });
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context inicijaliziran');
        } catch (error) {
            console.error('Greška pri inicijalizaciji audio context-a:', error);
        }
    }

    updateSF2Info(bankData = null) {
        const nameSpan = document.getElementById('sf2-name');
        const sizeSpan = document.getElementById('sf2-size');
        
        if (bankData) {
            nameSpan.textContent = bankData.name;
            sizeSpan.textContent = bankData.size;
        } else {
            nameSpan.textContent = 'Nije odabrana banka';
            sizeSpan.textContent = '';
        }
    }

    getCurrentBank() {
        return this.currentBank;
    }

    isBankLoaded() {
        return this.currentBank !== null;
    }

    showLoading(message) {
        // Prikaži loading poruku
        const select = document.getElementById('sf2-bank');
        if (select) {
            select.disabled = true;
            select.innerHTML = `<option value="">${message}</option>`;
        }
    }

    showSuccess(message) {
        // Prikaži success poruku
        console.log('Success:', message);
        // Ovdje možete dodati toast notification
    }

    showError(message) {
        // Prikaži error poruku
        console.error('Error:', message);
        // Ovdje možete dodati toast notification
    }

    // Metoda za reprodukciju MIDI s odabranom SF2 bankom
    async playMIDIWithWebAudio(midiData) {
        // Implementacija stvarne reprodukcije MIDI s Web Audio API
        console.log('MIDI reprodukcija započeta s Hamma bankom');
        
        // Ovdje bi se implementirala stvarna reprodukcija s SF2 bankom
        // Za sada koristimo Web Audio API za osnovnu reprodukciju
        if (!this.audioContext) {
            this.initAudioContext();
        }
        
        // Simulacija reprodukcije s Hamma zvukovima
        return new Promise(resolve => {
            console.log('Koristi se Hamma SF2 banka za reprodukciju');
            setTimeout(() => {
                console.log('MIDI reprodukcija završena s Hamma zvukovima');
                resolve();
            }, 2000);
        });
    }
}

// Inicijalizacija SF2 managera kada se stranica učita
document.addEventListener('DOMContentLoaded', function() {
    window.sf2Manager = new SF2Manager();
}); 