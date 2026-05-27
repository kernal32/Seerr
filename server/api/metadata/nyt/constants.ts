/** NYT Books API v3 — https://developer.nytimes.com/docs/books-product/1/overview */
export const NYT_BOOKS_API_BASE = 'https://api.nytimes.com/svc/books/v3';

/** Lists whose slug contains "audio" are treated as audiobook discover rows. */
export const inferMediaSubtypeFromNytList = (
  listName: string
): 'book' | 'audiobook' =>
  listName.toLowerCase().includes('audio') ? 'audiobook' : 'book';
