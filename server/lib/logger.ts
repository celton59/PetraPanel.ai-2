
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  debug(message: string, ...args: any[]) {
    console.log(`[${this.context}] 🐛 DEBUG:`, message, ...args);
  }

  info(message: string, ...args: any[]) {
    console.log(`[${this.context}] ℹ️ INFO:`, message, ...args);
  }

  error(message: string, error?: any) {
    console.error(`[${this.context}] ❌ ERROR:`, message);
    if (error) {
      console.error(`[${this.context}] Stack:`, error);
    }
  }
}
