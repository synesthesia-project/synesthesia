import array
import sys

UNIVERSE_SIZE = 512

from ola.ClientWrapper import ClientWrapper

def DmxSent(state):
  pass

universe = 0

wrapper = ClientWrapper()
client = wrapper.Client()

if sys.version_info[0] < 3:
    while True:
        bytes = bytearray(sys.stdin.read(UNIVERSE_SIZE + 1))
        client.SendDmx(bytes[0], array.array('B', bytes[1:]), DmxSent)
else:
    while True:
        bytes = bytearray(sys.stdin.buffer.read(UNIVERSE_SIZE + 1))
        client.SendDmx(bytes[0], array.array('B', bytes[1:]), DmxSent)
