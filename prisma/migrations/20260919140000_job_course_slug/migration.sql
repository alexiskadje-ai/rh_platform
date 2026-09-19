-- AlterTable
ALTER TABLE "JobOffer" ADD COLUMN "slug" TEXT;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "slug" TEXT;

-- Backfill JobOffer slugs from title + city + short unique suffix (md5 of id)
WITH computed AS (
  SELECT
    id,
    COALESCE(
      NULLIF(
        trim(both '-' FROM regexp_replace(
          lower(translate(
            replace(replace(replace(replace("title", 'œ', 'oe'), 'Œ', 'oe'), 'æ', 'ae'), 'Æ', 'ae'),
            'àâäáãåçéèêëìíîïñòóôõöùúûüýÿÀÂÄÁÃÅÇÉÈÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ',
            'aaaaaaceeeeiiiinooooouuuuyyaaaaaaceeeeiiiinooooouuuuyy'
          )),
          '[^a-z0-9]+',
          '-',
          'g'
        )),
        ''
      ),
      'offre'
    ) AS title_part,
    NULLIF(
      trim(both '-' FROM regexp_replace(
        lower(translate(
          replace(replace(replace(replace("city", 'œ', 'oe'), 'Œ', 'oe'), 'æ', 'ae'), 'Æ', 'ae'),
          'àâäáãåçéèêëìíîïñòóôõöùúûüýÿÀÂÄÁÃÅÇÉÈÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ',
          'aaaaaaceeeeiiiinooooouuuuyyaaaaaaceeeeiiiinooooouuuuyy'
        )),
        '[^a-z0-9]+',
        '-',
        'g'
      )),
      ''
    ) AS city_part,
    substr(md5(id), 1, 4) AS suffix
  FROM "JobOffer"
)
UPDATE "JobOffer" AS j
SET "slug" = CASE
  WHEN c.city_part IS NULL THEN c.title_part || '-' || c.suffix
  ELSE c.title_part || '-' || c.city_part || '-' || c.suffix
END
FROM computed c
WHERE j.id = c.id;

-- Backfill Course slugs from title + short unique suffix
WITH computed AS (
  SELECT
    id,
    COALESCE(
      NULLIF(
        trim(both '-' FROM regexp_replace(
          lower(translate(
            replace(replace(replace(replace("title", 'œ', 'oe'), 'Œ', 'oe'), 'æ', 'ae'), 'Æ', 'ae'),
            'àâäáãåçéèêëìíîïñòóôõöùúûüýÿÀÂÄÁÃÅÇÉÈÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ',
            'aaaaaaceeeeiiiinooooouuuuyyaaaaaaceeeeiiiinooooouuuuyy'
          )),
          '[^a-z0-9]+',
          '-',
          'g'
        )),
        ''
      ),
      'formation'
    ) AS title_part,
    substr(md5(id), 1, 4) AS suffix
  FROM "Course"
)
UPDATE "Course" AS c
SET "slug" = computed.title_part || '-' || computed.suffix
FROM computed
WHERE c.id = computed.id;

ALTER TABLE "JobOffer" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Course" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "JobOffer_slug_key" ON "JobOffer"("slug");
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");
