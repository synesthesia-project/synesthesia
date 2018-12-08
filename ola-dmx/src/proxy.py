import array
import sys
import time

UNIVERSE_SIZE = 512

from ola.ClientWrapper import ClientWrapper
from ola.OlaClient import OLADNotRunningException

def DmxSent(state):
  pass

universe = 0

client = None

while True:
    if client is None:
        try:
            client = ClientWrapper().Client()
        except OLADNotRunningException as e:
            print('olad not running, waiting until ready')
            time.sleep(1)
            continue
    bytes = None
    if sys.version_info[0] < 3:
        bytes = bytearray(sys.stdin.read(UNIVERSE_SIZE + 1))
    else:
        bytes = bytearray(sys.stdin.buffer.read(UNIVERSE_SIZE + 1))
    try:
        client.SendDmx(bytes[0], array.array('B', bytes[1:]), DmxSent)
    except OLADNotRunningException as e:
        print('olad has shut down')
        client = None
        pass
