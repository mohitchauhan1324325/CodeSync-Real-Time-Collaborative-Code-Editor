import 'dotenv/config';
import { ExecutionService } from './src/services/executionService.js';

(async () => {
  const key = process.env.JUDGE0_API_KEY?.trim() || '';
  console.log('Judge0 API key loaded:', key.length > 0 ? 'YES' : 'NO');

  const tests = [
    { lang: 'javascript', code: "console.log('Hello World');" },
    { lang: 'python', code: "print('Hello World')" },
    { lang: 'c', code: "#include <stdio.h>\nint main(){printf(\"Hello World\\n\");return 0; }" },
    { lang: 'cpp', code: "#include <iostream>\nint main(){std::cout << \"Hello World\\n\";return 0; }" },
    { lang: 'java', code: "public class Main { public static void main(String[] args) { System.out.println(\"Hello World\"); } }" },
  ];

  console.log('\n=== Language Tests ===');
  for (const t of tests) {
    try {
      const res = await ExecutionService.executeCode({
        roomId: 'TEST',
        userId: 'tester',
        language: t.lang,
        code: t.code,
        stdin: '',
      });
      console.log(`${t.lang}\tStatus:${res.status}\tOutput:${res.stdout.trim()}\tError:${res.stderr.trim()}`);
    } catch (e) {
      console.error(`${t.lang} execution error:`, e.message);
    }
  }

  // Python stdin test
  const pyStdin = await ExecutionService.executeCode({
    roomId: 'TEST',
    userId: 'tester',
    language: 'python',
    code: "import sys\n data = sys.stdin.read()\nprint('Echo:', data)",
    stdin: 'Sample input',
  });
  console.log('\n=== Python stdin test ===');
  console.log(`Status:${pyStdin.status}\tOutput:${pyStdin.stdout.trim()}\tError:${pyStdin.stderr.trim()}`);
})();
