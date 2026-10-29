/**
 * Original, procedural and optional ambience. No file downloads, no trackers,
 * no autoplay. All nodes are owned by this instance and can be closed.
 */
export class NeighborhoodAudio {
  constructor(){
    this.ctx=null;
    this.master=null;
    this.drone=null;
    this.lowGain=null;
    this.enabled=false;
    this.elapsed=0;
    this.lastChime=0;
  }
  async setEnabled(enabled){
    if(!enabled){this.enabled=false;if(this.master)this.master.gain.setTargetAtTime(0,this.ctx.currentTime,.08);return;}
    const AudioContextType=globalThis.AudioContext || globalThis.webkitAudioContext;
    if(!AudioContextType)throw new Error('Web Audio is unavailable in this browser');
    if(!this.ctx){
      const ctx=new AudioContextType();
      const master=ctx.createGain();
      master.gain.value=0;
      master.connect(ctx.destination);
      const low=ctx.createOscillator();low.type='sine';low.frequency.value=110;
      const lowGain=ctx.createGain();lowGain.gain.value=.025;
      low.connect(lowGain);lowGain.connect(master);
      low.start();
      this.ctx=ctx;this.master=master;this.drone=low;this.lowGain=lowGain;
    }
    await this.ctx.resume();
    this.enabled=true;
    this.master.gain.setTargetAtTime(.55,this.ctx.currentTime,.1);
  }
  tone(frequency=660,volume=.08,duration=.28){
    if(!this.enabled||!this.ctx)return;
    const t=this.ctx.currentTime;
    const oscillator=this.ctx.createOscillator(),gain=this.ctx.createGain();
    oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,t);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(110,frequency*.8),t+duration);
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(volume,t+.025);
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    oscillator.connect(gain);gain.connect(this.master);
    oscillator.start(t);oscillator.stop(t+duration+.01);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  }
  tick(delta,exploring){
    if(!this.enabled||!this.ctx)return;
    this.elapsed+=Math.min(delta,.1);
    if(this.elapsed-this.lastChime>(exploring?10:17)){
      this.lastChime=this.elapsed;
      this.tone(exploring?523.25:392,.025,.9);
    }
  }
  async dispose(){
    this.enabled=false;
    if(this.ctx){await this.ctx.close();this.ctx=null;this.master=null;}
  }
}
