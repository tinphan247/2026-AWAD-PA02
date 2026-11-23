// Minimum 9, at run time: no secrets. Looks for the canary values the test
// puts in the worker's environment (MODEL_API_KEY, DATABASE_URL) in this
// process's environment, in every visible /proc/*/environ, and in a few files
// a worker might keep them in. Prints "clean" when none is found.
#include <dirent.h>
#include <cstdio>
#include <cstring>
#include <string>

extern char** environ;

static bool fileHasCanary(const std::string& path) {
  FILE* f = std::fopen(path.c_str(), "rb");
  if (!f) return false;
  std::string data;
  char buf[4096];
  std::size_t n;
  while ((n = std::fread(buf, 1, sizeof buf, f)) > 0) data.append(buf, n);
  std::fclose(f);
  return data.find("leetkob-canary") != std::string::npos;
}

int main() {
  bool leaked = false;
  for (char** e = environ; *e; ++e)
    if (std::strstr(*e, "leetkob-canary")) leaked = true;

  if (DIR* proc = opendir("/proc")) {
    while (dirent* d = readdir(proc))
      if (d->d_name[0] >= '0' && d->d_name[0] <= '9')
        leaked = fileHasCanary(std::string("/proc/") + d->d_name + "/environ") || leaked;
    closedir(proc);
  }
  const char* files[] = {"/etc/leetkob/worker.env", "/run/secrets/model_api_key", "/.env",
                         "/home/sandbox/.env"};
  for (const char* f : files) leaked = fileHasCanary(f) || leaked;
  std::puts(leaked ? "LEAK" : "clean");
}
