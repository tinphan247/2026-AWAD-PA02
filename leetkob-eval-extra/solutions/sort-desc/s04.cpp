#include <algorithm>
#include <functional>
#include <iostream>
#include <vector>

namespace S = std;

void insertionSort(S::vector<long long>& v) {
    S::sort(v.begin(), v.end(), S::greater<long long>());
}

int main() {
    int n;
    S::cin >> n;
    S::vector<long long> v(n);
    for (auto& x : v) S::cin >> x;
    insertionSort(v);
    for (int i = 0; i < n; i++) S::cout << v[i] << (i + 1 < n ? ' ' : '\n');
    return 0;
}
