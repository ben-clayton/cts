import { SkipTestCase, UnexpectedPassError } from '../../framework/fixture.js';
import { now, assert } from '../../util/util.js';

import { LogMessageWithStack } from './log_message.js';
import { Expectation, LiveTestCaseResult } from './result.js';

enum LogSeverity {
  Pass = 0,
  Skip = 1,
  Warn = 2,
  ExpectFailed = 3,
  ValidationFailed = 4,
  ThrewException = 5,
}

const kMaxLogStacks = 2;

/** Holds onto a LiveTestCaseResult owned by the Logger, and writes the results into it. */
export class TestCaseRecorder {
  private result: LiveTestCaseResult;
  private inSubCase: boolean = false;
  private subCaseStatus = LogSeverity.Pass;
  private finalCaseStatus = LogSeverity.Pass;
  private hideStacksBelowSeverity = LogSeverity.Warn;
  private startTime = -1;
  private logs: LogMessageWithStack[] = [];
  private logLinesAtCurrentSeverity = 0;
  private debugging = false;
  /** Used to dedup log messages which have identical stacks. */
  private messagesForPreviouslySeenStacks = new Map<string, LogMessageWithStack>();

  constructor(result: LiveTestCaseResult, debugging: boolean) {
    this.result = result;
    this.debugging = debugging;
  }

  start(): void {
    assert(this.startTime < 0, 'TestCaseRecorder cannot be reused');
    this.startTime = now();
  }

  finish(): void {
    assert(this.startTime >= 0, 'finish() before start()');

    const timeMilliseconds = now() - this.startTime;
    // Round to next microsecond to avoid storing useless .xxxx00000000000002 in results.
    this.result.timems = Math.ceil(timeMilliseconds * 1000) / 1000;

    // Convert numeric enum back to string (but expose 'exception' as 'fail')
    this.result.status =
      this.finalCaseStatus === LogSeverity.Pass
        ? 'pass'
        : this.finalCaseStatus === LogSeverity.Skip
        ? 'skip'
        : this.finalCaseStatus === LogSeverity.Warn
        ? 'warn'
        : 'fail'; // Everything else is an error

    this.result.logs = this.logs;
  }

  beginSubCase() {
    this.subCaseStatus = LogSeverity.Pass;
    this.inSubCase = true;
  }

  endSubCase(expectedStatus: Expectation) {
    try {
      if (expectedStatus === 'fail') {
        if (this.subCaseStatus <= LogSeverity.Warn) {
          throw new UnexpectedPassError();
        } else {
          this.subCaseStatus = LogSeverity.Pass;
        }
      }
    } finally {
      this.inSubCase = false;
      if (this.subCaseStatus > this.finalCaseStatus) {
        this.finalCaseStatus = this.subCaseStatus;
      }
    }
  }

  injectResult(injectedResult: LiveTestCaseResult): void {
    Object.assign(this.result, injectedResult);
  }

  debug(ex: Error): void {
    if (!this.debugging) return;
    this.logImpl(LogSeverity.Pass, 'DEBUG', ex);
  }

  info(ex: Error): void {
    this.logImpl(LogSeverity.Pass, 'INFO', ex);
  }

  skipped(ex: SkipTestCase): void {
    this.logImpl(LogSeverity.Skip, 'SKIP', ex);
  }

  warn(ex: Error): void {
    this.logImpl(LogSeverity.Warn, 'WARN', ex);
  }

  expectationFailed(ex: Error): void {
    this.logImpl(LogSeverity.ExpectFailed, 'EXPECTATION FAILED', ex);
  }

  validationFailed(ex: Error): void {
    this.logImpl(LogSeverity.ValidationFailed, 'VALIDATION FAILED', ex);
  }

  threw(ex: Error): void {
    if (ex instanceof SkipTestCase) {
      this.skipped(ex);
      return;
    }
    this.logImpl(LogSeverity.ThrewException, 'EXCEPTION', ex);
  }

  private logImpl(level: LogSeverity, name: string, baseException: Error): void {
    const logMessage = new LogMessageWithStack(name, baseException);

    // Deduplicate errors with the exact same stack
    if (!this.debugging && logMessage.stack) {
      const seen = this.messagesForPreviouslySeenStacks.get(logMessage.stack);
      if (seen) {
        seen.incrementTimesSeen();
        return;
      }
      this.messagesForPreviouslySeenStacks.set(logMessage.stack, logMessage);
    }

    // Final case status should be the "worst" of all log entries.
    if (this.inSubCase) {
      if (level > this.subCaseStatus) this.subCaseStatus = level;
    } else {
      if (level > this.finalCaseStatus) this.finalCaseStatus = level;
    }

    // setStackHidden for all logs except `kMaxLogStacks` stacks at the highest severity
    if (level > this.hideStacksBelowSeverity) {
      this.logLinesAtCurrentSeverity = 0;
      this.hideStacksBelowSeverity = level;

      // Go back and setStackHidden for everything of a lower log level
      for (const log of this.logs) {
        log.setStackHidden();
      }
    }
    if (level === this.hideStacksBelowSeverity) {
      this.logLinesAtCurrentSeverity++;
    }
    if (level < this.hideStacksBelowSeverity || this.logLinesAtCurrentSeverity > kMaxLogStacks) {
      logMessage.setStackHidden();
    }

    this.logs.push(logMessage);
  }
}
