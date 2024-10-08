const bibtexTypes = {
  source: {
    article: 'article-journal',
    book: 'book',
    booklet: 'book',
    conference: 'paper-conference',
    inbook: 'chapter',
    incollection: 'chapter',
    inproceedings: 'paper-conference',
    manual: 'report',
    mastersthesis: 'thesis',
    misc: 'document',
    phdthesis: 'thesis',
    proceedings: 'book',
    techreport: 'report',
    unpublished: 'manuscript',
  },
  target: {
    article: 'article',
    'article-journal': 'article',
    'article-magazine': 'article',
    'article-newspaper': 'article',
    book: 'book',
    chapter: 'inbook',
    manuscript: 'unpublished',
    'paper-conference': 'inproceedings',
    report: 'techreport',
    review: 'article',
    'review-book': 'article',
  },
}

export default bibtexTypes
