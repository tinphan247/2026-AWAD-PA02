// Minimum 2: CPU time limit. Spins forever; must end as TLE.
int main() {
  volatile unsigned long long x = 0;
  for (;;) x = x * 6364136223846793005ULL + 1;
}
