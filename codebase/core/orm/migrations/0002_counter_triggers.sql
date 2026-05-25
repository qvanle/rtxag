CREATE OR REPLACE FUNCTION fn_sync_retrieval_document_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE retrieval_collections
    SET document_count = document_count + 1,
        updated_at = NOW()
    WHERE id = NEW.collection_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE retrieval_collections
    SET document_count = GREATEST(document_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_retrieval_document_count ON retrieval_documents;
CREATE TRIGGER trg_retrieval_document_count
AFTER INSERT OR DELETE ON retrieval_documents
FOR EACH ROW EXECUTE FUNCTION fn_sync_retrieval_document_count();

CREATE OR REPLACE FUNCTION fn_sync_tools_record_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tools_collections
    SET record_count = record_count + 1,
        updated_at = NOW()
    WHERE id = NEW.collection_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tools_collections
    SET record_count = GREATEST(record_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tools_record_count ON tools_records;
CREATE TRIGGER trg_tools_record_count
AFTER INSERT OR DELETE ON tools_records
FOR EACH ROW EXECUTE FUNCTION fn_sync_tools_record_count();
