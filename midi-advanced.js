// Advanced MIDI Controller - Jednostavna verzija koja radi
class AdvancedMIDIController {
    constructor() {
        this.midiController = null;
        this.isPlaying = false;
        this.midiFile = null;
        this.midiEvents = [];
        this.audioContext = null;
        this.synth = null;
        
        this.initializeElements();
        this.bindEvents();
        this.setupVirtualPiano();
        this.initializeButtonStates();
    }

    connectToMIDIController(midiController) {
        this.midiController = midiController;
        console.log('Advanced MIDI Controller povezan');
    }

    initializeElements() {
        this.playFileBtn = document.getElementById('play-file');
        this.pauseFileBtn = document.getElementById('pause-file');
        this.stopFileBtn = document.getElementById('stop-file');
        this.midiFileInput = document.getElementById('midi-file');
        this.fileInfo = document.getElementById('file-info');
    }

    bindEvents() {
        this.playFileBtn.addEventListener('click', () => this.playMidiFile());
        this.pauseFileBtn.addEventListener('click', () => this.pauseMidiFile());
        this.stopFileBtn.addEventListener('click', () => this.stopMidiFile());
        this.midiFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.midiFile = e.target.result;
            this.parseMidiFile(e.target.result);
            this.fileInfo.innerHTML = `
                <p><strong>Datoteka:</strong> ${file.name}</p>
                <p><strong>Veličina:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
                <p><strong>Eventi:</strong> ${this.midiEvents.length}</p>
            `;
            this.log(`MIDI datoteka učitana: ${file.name}`, 'success');
        };
        reader.readAsArrayBuffer(file);
    }

    parseMidiFile(arrayBuffer) {
        try {
            const dataView = new DataView(arrayBuffer);
            this.midiEvents = [];
            this.channelInstruments = {};
            this.channelBanks = {};
            
            // Inicijaliziraj kanale
            for (let i = 0; i < 16; i++) {
                this.channelInstruments[i] = 0; // Default: Acoustic Grand Piano
                this.channelBanks[i] = 0;
            }
            
            let offset = 0;
            
            // Preskoči header
            if (dataView.getUint32(offset) === 0x4D546864) {
                offset += 14; // Preskoči header
            }
            
            // Traži trackove
            while (offset < dataView.byteLength - 4) {
                if (dataView.getUint32(offset) === 0x4D54726B) { // MTrk
                    offset += 8; // Preskoči track header
                    const trackLength = dataView.getUint32(offset - 4);
                    const trackEnd = offset + trackLength;
                    
                    let currentTime = 0;
                    let lastStatus = 0;
                    
                    while (offset < trackEnd && offset < dataView.byteLength - 2) {
                        const result = this.parseMidiEvent(dataView, offset, currentTime, lastStatus);
                        if (result.event) {
                            this.midiEvents.push(result.event);
                            
                            // Ažuriraj instrumente
                            if (result.event.type === 'programChange') {
                                this.channelInstruments[result.event.channel] = result.event.program;
                                console.log(`Kanal ${result.event.channel}: Instrument ${result.event.program} (${this.getInstrumentName(result.event.program)})`);
                            } else if (result.event.type === 'bankSelect') {
                                this.channelBanks[result.event.channel] = result.event.bank;
                            }
                        }
                        offset = result.nextOffset;
                        currentTime = result.newTime;
                        lastStatus = result.lastStatus;
                    }
                } else {
                    offset++;
                }
            }
            
            // Sortiraj evente po vremenu
            this.midiEvents.sort((a, b) => a.time - b.time);
            
            console.log(`Parsirano ${this.midiEvents.length} eventa`);
            console.log('Instrumenti po kanalima:', this.channelInstruments);
            
        } catch (error) {
            console.error('Greška pri parsiranju:', error);
            this.midiEvents = [];
        }
    }

    parseMidiEvent(dataView, offset, currentTime, lastStatus) {
        // Čitaj delta time
        let deltaTime = 0;
        let byte;
        do {
            if (offset >= dataView.byteLength) break;
            byte = dataView.getUint8(offset);
            offset++;
            deltaTime = (deltaTime << 7) | (byte & 0x7F);
        } while (byte & 0x80);
        
        const newTime = currentTime + deltaTime;
        
        if (offset >= dataView.byteLength) {
            return { event: null, nextOffset: offset, newTime: newTime, lastStatus: lastStatus };
        }
        
        let status = dataView.getUint8(offset);
        offset++;
        
        // Running status
        if (status < 0x80) {
            status = lastStatus;
            offset--;
        }
        
        let event = null;
        
        if (status >= 0x80 && status < 0xF0) {
            const channel = status & 0x0F;
            const command = status & 0xF0;
            
            if (command === 0x90) { // Note On
                if (offset + 1 < dataView.byteLength) {
                    const note = dataView.getUint8(offset);
                    const velocity = dataView.getUint8(offset + 1);
                    offset += 2;
                    
                    if (velocity > 0) {
                        event = {
                            time: newTime,
                            type: 'noteOn',
                            note: note,
                            velocity: velocity,
                            channel: channel,
                            instrument: this.channelInstruments[channel] || 0
                        };
                    } else {
                        event = {
                            time: newTime,
                            type: 'noteOff',
                            note: note,
                            velocity: 0,
                            channel: channel,
                            instrument: this.channelInstruments[channel] || 0
                        };
                    }
                }
            } else if (command === 0x80) { // Note Off
                if (offset + 1 < dataView.byteLength) {
                    const note = dataView.getUint8(offset);
                    const velocity = dataView.getUint8(offset + 1);
                    offset += 2;
                    
                    event = {
                        time: newTime,
                        type: 'noteOff',
                        note: note,
                        velocity: velocity,
                        channel: channel,
                        instrument: this.channelInstruments[channel] || 0
                    };
                }
            } else if (command === 0xC0) { // Program Change
                if (offset < dataView.byteLength) {
                    const program = dataView.getUint8(offset);
                    offset++;
                    
                    event = {
                        time: newTime,
                        type: 'programChange',
                        program: program,
                        channel: channel
                    };
                }
            } else if (command === 0xB0) { // Control Change
                if (offset + 1 < dataView.byteLength) {
                    const controller = dataView.getUint8(offset);
                    const value = dataView.getUint8(offset + 1);
                    offset += 2;
                    
                    if (controller === 0) { // Bank Select MSB
                        event = {
                            time: newTime,
                            type: 'bankSelect',
                            bank: value,
                            channel: channel
                        };
                    }
                }
            } else {
                // Ostale MIDI komande - preskoči parametre
                if (command === 0xA0 || command === 0xE0) {
                    offset += 2;
                } else if (command === 0xD0) {
                    offset += 1;
                }
            }
        } else if (status === 0xFF) {
            // Meta event - preskoči
            if (offset < dataView.byteLength) {
                const metaType = dataView.getUint8(offset);
                offset++;
                
                let length = 0;
                let byte;
                do {
                    if (offset >= dataView.byteLength) break;
                    byte = dataView.getUint8(offset);
                    offset++;
                    length = (length << 7) | (byte & 0x7F);
                } while (byte & 0x80);
                
                offset += length;
            }
        }
        
        return {
            event: event,
            nextOffset: offset,
            newTime: newTime,
            lastStatus: status >= 0x80 ? status : lastStatus
        };
    }

    async playMidiFile() {
        if (!this.midiFile) {
            this.log('Prvo odaberite MIDI datoteku', 'error');
            return;
        }
        
        this.log('Pokretanje reprodukcije...', 'control');
        
        try {
            // Inicijaliziraj audio context
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('Audio context kreiran');
            }
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('Audio context resumed');
            }
            
            // Test zvuk - duži
            this.playTestSound();
            
            // Čekaj da se test završi
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Reproduciraj MIDI
            this.isPlaying = true;
            this.playFileBtn.disabled = true;
            this.pauseFileBtn.disabled = false;
            this.stopFileBtn.disabled = false;
            
            await this.playMidiEvents();
            
        } catch (error) {
            console.error('Greška:', error);
            this.log(`Greška: ${error.message}`, 'error');
        }
    }

    playTestSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 440;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 2);
        
        console.log('Test zvuk pokrenut - trebate čuti 2 sekunde beep-a');
    }

    async playMidiEvents() {
        if (!this.midiEvents || this.midiEvents.length === 0) {
            this.log('Nema eventa za reprodukciju', 'error');
            return;
        }
        
        const startTime = this.audioContext.currentTime;
        const tempo = 120;
        const ticksPerQuarter = 480;
        const msPerTick = (60000 / tempo) / ticksPerQuarter;
        
        console.log(`Reprodukcija ${this.midiEvents.length} eventa`);
        console.log('Instrumenti po kanalima:', this.channelInstruments);
        
        // Reproduciraj sve note s pravilnim timing-om
        for (let i = 0; i < this.midiEvents.length; i++) {
            if (!this.isPlaying) break;
            
            const event = this.midiEvents[i];
            const playTime = startTime + (event.time * msPerTick / 1000);
            
            if (event.type === 'noteOn') {
                this.scheduleNote(event.note, event.velocity, playTime, event.instrument, event.channel);
                this.log(`Note On: ${this.getNoteName(event.note)} (${event.note}) - Kanal ${event.channel} - ${this.getInstrumentName(event.instrument)}`, 'note-on');
            } else if (event.type === 'noteOff') {
                this.scheduleNoteOff(event.note, playTime, event.channel);
            }
        }
        
        // Čekaj da se završi
        const maxTime = Math.max(...this.midiEvents.map(e => e.time)) * msPerTick;
        await new Promise(resolve => setTimeout(resolve, maxTime + 3000));
        
        this.log('Reprodukcija završena', 'success');
        this.stopMidiFile();
    }

    scheduleNote(note, velocity, playTime, instrument, channel) {
        if (!this.audioContext) return;
        
        const frequency = 440 * Math.pow(2, (note - 69) / 12);
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Odaberi tip oscilatora na osnovu instrumenta
        const waveType = this.getWaveTypeForInstrument(instrument);
        oscillator.type = waveType;
        oscillator.frequency.value = frequency;
        
        // Envelope ovisno o instrumentu
        this.applyInstrumentEnvelope(gainNode, instrument, velocity, playTime);
        
        // Poveži nodes
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Pohrani za kasnije zaustavljanje
        if (!this.synth) this.synth = { oscillators: new Map() };
        if (!this.synth.oscillators.has(channel)) {
            this.synth.oscillators.set(channel, new Map());
        }
        this.synth.oscillators.get(channel).set(note, { oscillator, gainNode });
        
        oscillator.start(playTime);
        oscillator.stop(playTime + this.getInstrumentDuration(instrument));
        
        console.log(`Scheduled note ${note} (${this.getNoteName(note)}) on channel ${channel} with instrument ${instrument} (${this.getInstrumentName(instrument)})`);
    }

    scheduleNoteOff(note, playTime, channel) {
        if (!this.synth || !this.synth.oscillators.has(channel)) return;
        
        const channelOscillators = this.synth.oscillators.get(channel);
        const noteData = channelOscillators.get(note);
        
        if (noteData) {
            // Release envelope
            noteData.gainNode.gain.linearRampToValueAtTime(0, playTime + 0.5);
            noteData.oscillator.stop(playTime + 0.5);
            channelOscillators.delete(note);
        }
    }

    getWaveTypeForInstrument(instrument) {
        // Mapiranje instrumenata na tipove valova
        if (instrument >= 0 && instrument <= 7) return 'sine'; // Piano
        if (instrument >= 8 && instrument <= 15) return 'triangle'; // Chromatic Percussion
        if (instrument >= 16 && instrument <= 23) return 'sawtooth'; // Organ
        if (instrument >= 24 && instrument <= 31) return 'sawtooth'; // Guitar
        if (instrument >= 32 && instrument <= 39) return 'sine'; // Bass
        if (instrument >= 40 && instrument <= 47) return 'sine'; // Strings
        if (instrument >= 48 && instrument <= 55) return 'sine'; // Ensemble
        if (instrument >= 56 && instrument <= 63) return 'sine'; // Brass
        if (instrument >= 64 && instrument <= 71) return 'sine'; // Reed
        if (instrument >= 72 && instrument <= 79) return 'sine'; // Pipe
        if (instrument >= 80 && instrument <= 87) return 'sawtooth'; // Synth Lead
        if (instrument >= 88 && instrument <= 95) return 'sine'; // Synth Pad
        if (instrument >= 96 && instrument <= 103) return 'sawtooth'; // Synth Effects
        if (instrument >= 104 && instrument <= 111) return 'sine'; // Ethnic
        if (instrument >= 112 && instrument <= 119) return 'square'; // Percussive
        if (instrument >= 120 && instrument <= 127) return 'sine'; // Sound Effects
        
        return 'sine';
    }

    applyInstrumentEnvelope(gainNode, instrument, velocity, playTime) {
        const now = this.audioContext.currentTime;
        const attackTime = 0.01;
        const decayTime = 0.1;
        const sustainLevel = 0.3;
        const releaseTime = 0.5;
        
        // Različiti envelopei za različite instrumente
        if (instrument >= 0 && instrument <= 7) { // Piano
            gainNode.gain.setValueAtTime(0, playTime);
            gainNode.gain.linearRampToValueAtTime(velocity / 127 * 0.8, playTime + attackTime);
            gainNode.gain.linearRampToValueAtTime(sustainLevel, playTime + attackTime + decayTime);
        } else if (instrument >= 16 && instrument <= 23) { // Organ
            gainNode.gain.setValueAtTime(velocity / 127 * 0.6, playTime);
            gainNode.gain.linearRampToValueAtTime(velocity / 127 * 0.6, playTime + 1);
        } else if (instrument >= 24 && instrument <= 31) { // Guitar
            gainNode.gain.setValueAtTime(0, playTime);
            gainNode.gain.linearRampToValueAtTime(velocity / 127 * 0.7, playTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(sustainLevel, playTime + 0.2);
        } else { // Ostali instrumenti
            gainNode.gain.setValueAtTime(0, playTime);
            gainNode.gain.linearRampToValueAtTime(velocity / 127 * 0.5, playTime + attackTime);
            gainNode.gain.linearRampToValueAtTime(sustainLevel, playTime + attackTime + decayTime);
        }
    }

    getInstrumentDuration(instrument) {
        // Različita trajanja za različite instrumente
        if (instrument >= 0 && instrument <= 7) return 1.0; // Piano
        if (instrument >= 16 && instrument <= 23) return 2.0; // Organ
        if (instrument >= 24 && instrument <= 31) return 0.8; // Guitar
        if (instrument >= 40 && instrument <= 47) return 1.5; // Strings
        if (instrument >= 56 && instrument <= 63) return 1.2; // Brass
        return 1.0; // Default
    }

    getInstrumentName(programNumber) {
        const instruments = [
            'Acoustic Grand Piano', 'Bright Acoustic Piano', 'Electric Grand Piano', 'Honky-tonk Piano',
            'Electric Piano 1', 'Electric Piano 2', 'Harpsichord', 'Clavi', 'Celesta', 'Glockenspiel',
            'Music Box', 'Vibraphone', 'Marimba', 'Xylophone', 'Tubular Bells', 'Dulcimer',
            'Drawbar Organ', 'Percussive Organ', 'Rock Organ', 'Church Organ', 'Reed Organ', 'Accordion',
            'Harmonica', 'Tango Accordion', 'Acoustic Guitar (nylon)', 'Acoustic Guitar (steel)',
            'Electric Guitar (jazz)', 'Electric Guitar (clean)', 'Electric Guitar (muted)',
            'Overdriven Guitar', 'Distortion Guitar', 'Guitar harmonics', 'Acoustic Bass',
            'Electric Bass (finger)', 'Electric Bass (pick)', 'Fretless Bass', 'Slap Bass 1',
            'Slap Bass 2', 'Synth Bass 1', 'Synth Bass 2', 'Violin', 'Viola', 'Cello', 'Contrabass',
            'Tremolo Strings', 'Pizzicato Strings', 'Orchestral Harp', 'Timpani',
            'String Ensemble 1', 'String Ensemble 2', 'SynthStrings 1', 'SynthStrings 2',
            'Choir Aahs', 'Voice Oohs', 'Synth Voice', 'Orchestra Hit', 'Trumpet', 'Trombone',
            'Tuba', 'Muted Trumpet', 'French Horn', 'Brass Section', 'SynthBrass 1', 'SynthBrass 2',
            'Soprano Sax', 'Alto Sax', 'Tenor Sax', 'Baritone Sax', 'Oboe', 'English Horn',
            'Bassoon', 'Clarinet', 'Piccolo', 'Flute', 'Recorder', 'Pan Flute', 'Blown Bottle',
            'Shakuhachi', 'Whistle', 'Ocarina', 'Lead 1 (square)', 'Lead 2 (sawtooth)',
            'Lead 3 (calliope)', 'Lead 4 (chiff)', 'Lead 5 (charang)', 'Lead 6 (voice)',
            'Lead 7 (fifths)', 'Lead 8 (bass + lead)', 'Pad 1 (new age)', 'Pad 2 (warm)',
            'Pad 3 (polysynth)', 'Pad 4 (choir)', 'Pad 5 (bowed)', 'Pad 6 (metallic)',
            'Pad 7 (halo)', 'Pad 8 (sweep)', 'FX 1 (rain)', 'FX 2 (soundtrack)',
            'FX 3 (crystal)', 'FX 4 (atmosphere)', 'FX 5 (brightness)', 'FX 6 (goblins)',
            'FX 7 (echoes)', 'FX 8 (sci-fi)', 'Sitar', 'Banjo', 'Shamisen', 'Koto',
            'Kalimba', 'Bag pipe', 'Fiddle', 'Shanai', 'Tinkle Bell', 'Agogo',
            'Steel Drums', 'Woodblock', 'Taiko Drum', 'Melodic Tom', 'Synth Drum',
            'Reverse Cymbal', 'Guitar Fret Noise', 'Breath Noise', 'Seashore',
            'Bird Tweet', 'Telephone Ring', 'Helicopter', 'Applause', 'Gunshot'
        ];
        
        return instruments[programNumber] || `Instrument ${programNumber}`;
    }

    getNoteName(note) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(note / 12) - 1;
        return `${noteNames[note % 12]}${octave}`;
    }

    stopMidiFile() {
        this.isPlaying = false;
        this.playFileBtn.disabled = false;
        this.pauseFileBtn.disabled = true;
        this.stopFileBtn.disabled = true;
        this.log('Reprodukcija zaustavljena', 'control');
    }

    pauseMidiFile() {
        this.isPlaying = false;
        this.playFileBtn.disabled = false;
        this.pauseFileBtn.disabled = true;
        this.log('Reprodukcija pauzirana', 'control');
    }

    log(message, type = 'info') {
        if (this.midiController && this.midiController.log) {
            this.midiController.log(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Ostale funkcije...
    setupVirtualPiano() {
        // Virtual piano setup
    }

    initializeButtonStates() {
        this.playFileBtn.disabled = false;
        this.pauseFileBtn.disabled = true;
        this.stopFileBtn.disabled = true;
    }
}

// Inicijalizacija
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.midiController) {
            window.advancedMIDIController = new AdvancedMIDIController();
            window.advancedMIDIController.connectToMIDIController(window.midiController);
        } else {
            console.error('MIDI Controller nije dostupan');
        }
    }, 100);
}); 