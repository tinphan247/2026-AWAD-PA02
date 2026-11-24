#include <cstdio>
#include <algorithm>

// std::sort / qsort are banned; std::swap from <algorithm> is fine
static const char* NOTE = "insertion sort, no std::sort(a, a + n) here";

int a[1005];

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    for (int i = 0; i < n; i++) scanf("%d", &a[i]);
    for (int i = 1; i < n; i++)
        for (int j = i; j > 0 && a[j - 1] < a[j]; j--)
            std::swap(a[j - 1], a[j]);
    for (int i = 0; i < n; i++) printf("%d%c", a[i], i + 1 < n ? ' ' : '\n');
    (void)NOTE;
    return 0;
}
