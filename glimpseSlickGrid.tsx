const validateSearchHistory = (state: GlimpseSearchProps): GlimpseSearchProps => {
    let updated = false;
    const searchItemHistory = state.searchItemHistory.map((searchItem: any) => {
        if (typeof searchItem === 'object' && searchItem !== null && !('id' in searchItem)) {
            updated = true;
            return { ...searchItem, id: uuidv4() };
        }
        return searchItem;
    });
    return { ...state, searchItemHistory };
};

const validateSearchState = (state: GlimpseSearchState): GlimpseSearchState => {
    let updated = false;
    const results = state.results.map((result: SearchResult) => {
        if (!result.id) {
            updated = true;
            return { ...result, id: uuidv4() };
        }
        return result;
    });
    return { ...state, results };
};
