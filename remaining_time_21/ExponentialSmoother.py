import time

class LogEntry:
    def __init__(self, epoch, dt, dy, ease, cid):
        self.epoch = epoch
        self.dt = dt
        self.dy = dy
        self.ease = ease
        self.cid = cid

class ExponentialSmoother:
    def __init__(self):
        self.reset()

    def reset(self):
        self.logs = []
        self.elapsedTime = 0
        self._startTime = time.time()

    def update(self, epoch, dy, ease, cid):
        if self.logs:
            dt = epoch - self.logs[-1].epoch
        else:
            dt = epoch - self._startTime
        self.logs.append(LogEntry(epoch, dt, dy, ease, cid))
        self.elapsedTime = time.time() - self._startTime

    def undoUpdate(self):
        self.logs.pop()
        self.elapsedTime = time.time() - self._startTime

    def updateLastEntryEase(self, ease):
        if not self.logs:
            return
        self.lastAnswerEase = ease

    def getSlope(self):
        if len(self.logs) < 2:
            return 1e-6

        totTime = 0
        totY = 0

        # Only take last 100 review session for estimation.
        for i, log in enumerate(self.logs[-100:]):
            r = 1.005 ** i
            totTime += r * min(log.dt, 300)
            totY += r * log.dy

        if totTime < 1:
            return 1
        return max(totY / totTime, 1e-6)
