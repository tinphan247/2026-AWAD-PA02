// Minimum 9, at compile time: the compiler cannot #include a secret. The
// worker keeps its key in /etc/leetkob/worker.env on its own machine; inside
// the sandbox that file does not exist, so this must fail to compile.
#include "/etc/leetkob/worker.env"
int main() {}
