import {spawn, ChildProcess} from 'child_process';

const UNIVERSE_SIZE = 512;

export class DmxProxy {
  private readonly process: ChildProcess;
  // 512 bytes of DMX data + 1 byte for the universe
  private readonly buffer = new Buffer(UNIVERSE_SIZE + 1);

  public constructor(proxyPath: string) {
    // -u makes python treat stdio as binary
    this.process = spawn('python', ['-u', proxyPath]);
    this.process.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    this.process.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });
    this.process.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });
  }

  public writeDmx(universe: number, dmx: Int8Array) {
    if (dmx.length !== UNIVERSE_SIZE)
      throw new Error('Invalid DMX input');
    this.buffer[0] = universe;
    this.buffer.set(dmx, 1);
    this.process.stdin.write(this.buffer);
  }
}
