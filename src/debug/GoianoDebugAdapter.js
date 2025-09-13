const { EventEmitter } = require('events');
const path = require('path');

class GoianoDebugAdapter extends EventEmitter {
  constructor() {
    super();
    this.isDebugging = false;
    this.currentFile = null;
    this.currentLine = 1;
    this.breakpoints = new Map();
    this.watchedVariables = new Set();
    this.variables = new Map();
    this.callStack = [];
    this.isPaused = false;
  }

  // Debug Adapter Protocol - Initialize
  initialize(args) {
    return {
      supportsConfigurationDoneRequest: true,
      supportsEvaluateForHovers: true,
      supportsStepBack: false,
      supportsSetVariable: true,
      supportsRestartFrame: false,
      supportsGotoTargetsRequest: false,
      supportsStepInTargetsRequest: false,
      supportsCompletionsRequest: true,
      supportsModulesRequest: false,
      supportsRestartRequest: true,
      supportsExceptionOptions: true,
      supportsValueFormattingOptions: true,
      supportsExceptionInfoRequest: true,
      supportTerminateDebuggee: true,
      supportsDelayedStackTraceLoading: true,
      supportsLoadedSourcesRequest: false,
      supportsLogMessage: true,
      supportsTerminateThreadsRequest: true,
      supportsSetExpression: false,
      supportsTerminateRequest: true,
      exceptionBreakpointFilters: [
        {
          filter: 'erros_goianos',
          label: 'Erros Goianos',
          default: true
        }
      ]
    };
  }

  // Launch configuration
  launch(args) {
    this.currentFile = args.program;
    this.isDebugging = true;
    
    // Emit initialized event
    this.emit('initialized');
    
    return Promise.resolve();
  }

  // Set breakpoints
  setBreakpoints(args) {
    const filePath = args.source.path;
    const requestedBreakpoints = args.breakpoints || [];
    
    // Clear existing breakpoints for this file
    this.breakpoints.delete(filePath);
    
    const actualBreakpoints = [];
    
    requestedBreakpoints.forEach((bp, index) => {
      const line = bp.line;
      
      // Add breakpoint
      if (!this.breakpoints.has(filePath)) {
        this.breakpoints.set(filePath, new Set());
      }
      this.breakpoints.get(filePath).add(line);
      
      // Return verified breakpoint
      actualBreakpoints.push({
        verified: true,
        line: line,
        id: index
      });
    });
    
    return {
      breakpoints: actualBreakpoints
    };
  }

  // Continue execution
  continue(args) {
    this.isPaused = false;
    this.emit('continued', { threadId: 1 });
    return { allThreadsContinued: true };
  }

  // Step next
  next(args) {
    this.currentLine++;
    this.emit('stopped', {
      reason: 'step',
      threadId: 1,
      allThreadsStopped: true
    });
    return Promise.resolve();
  }

  // Step into
  stepIn(args) {
    this.currentLine++;
    this.callStack.push({
      name: 'função_goiana',
      line: this.currentLine,
      column: 1
    });
    
    this.emit('stopped', {
      reason: 'step',
      threadId: 1,
      allThreadsStopped: true
    });
    return Promise.resolve();
  }

  // Step out  
  stepOut(args) {
    if (this.callStack.length > 0) {
      this.callStack.pop();
    }
    
    this.emit('stopped', {
      reason: 'step', 
      threadId: 1,
      allThreadsStopped: true
    });
    return Promise.resolve();
  }

  // Get stack trace
  stackTrace(args) {
    const stackFrames = [{
      id: 1,
      name: 'main',
      source: {
        name: path.basename(this.currentFile),
        path: this.currentFile
      },
      line: this.currentLine,
      column: 1
    }];

    // Add call stack frames
    this.callStack.forEach((frame, index) => {
      stackFrames.push({
        id: index + 2,
        name: frame.name,
        source: {
          name: path.basename(this.currentFile),
          path: this.currentFile
        },
        line: frame.line,
        column: frame.column || 1
      });
    });

    return {
      stackFrames,
      totalFrames: stackFrames.length
    };
  }

  // Get scopes
  scopes(args) {
    return {
      scopes: [
        {
          name: 'Variáveis Locais',
          variablesReference: 1,
          expensive: false
        },
        {
          name: 'Variáveis Goianas',
          variablesReference: 2,
          expensive: false
        }
      ]
    };
  }

  // Get variables
  variables(args) {
    const variables = [];
    
    // Add watched variables
    this.variables.forEach((value, name) => {
      variables.push({
        name: name,
        value: String(value),
        type: typeof value,
        variablesReference: 0
      });
    });

    // Add some built-in goiano variables
    variables.push({
      name: 'trem_atual',
      value: 'null',
      type: 'object',
      variablesReference: 0
    });

    return { variables };
  }

  // Evaluate expression
  evaluate(args) {
    const expression = args.expression;
    
    // Check if it's a variable
    if (this.variables.has(expression)) {
      const value = this.variables.get(expression);
      return {
        result: String(value),
        type: typeof value,
        variablesReference: 0
      };
    }

    // Simple expression evaluation for demo
    try {
      const result = eval(expression);
      return {
        result: String(result),
        type: typeof result,
        variablesReference: 0
      };
    } catch (error) {
      return {
        result: `Erro: ${error.message}`,
        type: 'error',
        variablesReference: 0
      };
    }
  }

  // Disconnect
  disconnect(args) {
    this.isDebugging = false;
    this.currentFile = null;
    this.breakpoints.clear();
    this.variables.clear();
    this.callStack = [];
    return Promise.resolve();
  }

  // Check if line has breakpoint
  hasBreakpoint(filePath, line) {
    return this.breakpoints.has(filePath) && 
           this.breakpoints.get(filePath).has(line);
  }

  // Add variable to watch
  addVariable(name, value) {
    this.variables.set(name, value);
    this.watchedVariables.add(name);
  }

  // Remove variable from watch
  removeVariable(name) {
    this.variables.delete(name);
    this.watchedVariables.delete(name);
  }

  // Simulate breakpoint hit
  hitBreakpoint(filePath, line) {
    if (this.hasBreakpoint(filePath, line)) {
      this.isPaused = true;
      this.currentLine = line;
      
      this.emit('stopped', {
        reason: 'breakpoint',
        threadId: 1,
        allThreadsStopped: true
      });
    }
  }

  // Configuration done
  configurationDone(args) {
    return Promise.resolve();
  }

  // Get threads
  threads() {
    return {
      threads: [
        {
          id: 1,
          name: 'Thread Principal GoiásScript'
        }
      ]
    };
  }
}

module.exports = GoianoDebugAdapter;