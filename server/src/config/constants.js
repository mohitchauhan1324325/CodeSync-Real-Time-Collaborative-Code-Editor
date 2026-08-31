export const SUPPORTED_LANGUAGES = {
  javascript: {
    id: 63, // Judge0 JavaScript (Node.js 12.14.0 / modern)
    name: 'JavaScript',
    monaco: 'javascript',
    extension: 'js',
    defaultCode: `// CodeSync Collaborative Environment - JavaScript
function main() {
  console.log("Welcome to CodeSync!");
  const items = [1, 2, 3, 4, 5];
  const sum = items.reduce((acc, curr) => acc + curr, 0);
  console.log("Sum:", sum);
}

main();
`
  },
  typescript: {
    id: 74, // TypeScript
    name: 'TypeScript',
    monaco: 'typescript',
    extension: 'ts',
    defaultCode: `// CodeSync Collaborative Environment - TypeScript
interface User {
  id: number;
  name: string;
}

const greet = (user: User): string => {
  return \`Hello, \${user.name} (ID: \${user.id})\`;
};

console.log(greet({ id: 1, name: "Developer" }));
`
  },
  python: {
    id: 71, // Python (3.8.1)
    name: 'Python',
    monaco: 'python',
    extension: 'py',
    defaultCode: `# CodeSync Collaborative Environment - Python
def main():
    print("Welcome to CodeSync!")
    numbers = [x * 2 for x in range(1, 6)]
    print(f"Computed numbers: {numbers}")

if __name__ == "__main__":
    main()
`
  },
  cpp: {
    id: 54, // C++ (GCC 9.2.0)
    name: 'C++',
    monaco: 'cpp',
    extension: 'cpp',
    defaultCode: `// CodeSync Collaborative Environment - C++
#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "Welcome to CodeSync in C++!" << std::endl;
    std::vector<int> nums = {10, 20, 30, 40, 50};
    int sum = std::accumulate(nums.begin(), nums.end(), 0);
    std::cout << "Total Sum: " << sum << std::endl;
    return 0;
}
`
  },
  c: {
    id: 50, // C (GCC 9.2.0)
    name: 'C',
    monaco: 'c',
    extension: 'c',
    defaultCode: `// CodeSync Collaborative Environment - C
#include <stdio.h>

int main() {
    printf("Welcome to CodeSync in C!\\n");
    for (int i = 1; i <= 5; i++) {
        printf("Step %d\\n", i);
    }
    return 0;
}
`
  },
  java: {
    id: 62, // Java (OpenJDK 13.0.1)
    name: 'Java',
    monaco: 'java',
    extension: 'java',
    defaultCode: `// CodeSync Collaborative Environment - Java
public class Main {
    public static void main(String[] args) {
        System.out.println("Welcome to CodeSync in Java!");
        int a = 15;
        int b = 27;
        System.out.println("Result: " + (a + b));
    }
}
`
  },
  go: {
    id: 60, // Go (1.13.5)
    name: 'Go',
    monaco: 'go',
    extension: 'go',
    defaultCode: `// CodeSync Collaborative Environment - Go
package main

import "fmt"

func main() {
    fmt.Println("Welcome to CodeSync in Go!")
    messages := []string{"Real-time", "Collaborative", "Fast"}
    for i, msg := range messages {
        fmt.Printf("%d: %s\\n", i+1, msg)
    }
}
`
  }
};

export const USER_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
];
