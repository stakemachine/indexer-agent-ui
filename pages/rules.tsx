import { Row } from "@tanstack/react-table";
import request from "graphql-request";
import useSWR from "swr";
import CreateIndexingRuleForm from "../components/Forms/CreateIndexingRule";
import IndexingRulesActionsBatch from "../components/Table/IndexingRules/batchActions";
import { indexingRuleColumns } from "../components/Table/IndexingRules/columns";
import TableComponent from "../components/Table/table";
import { INDEXING_RULES_LIST_QUERY } from "../lib/graphql/queries";
import { IndexingRule } from "../types/types";
import { useCallback, useRef, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Button, Modal } from "react-daisyui";

const renderSubComponent = ({ row }: { row: Row<IndexingRule> }) => {
  return (
    <pre style={{ fontSize: "10px" }}>
      <code>{JSON.stringify(row.original, null, 2)}</code>
    </pre>
  );
};

export default function RulesPage() {
  const { data, error, mutate, isValidating } = useSWR(
    INDEXING_RULES_LIST_QUERY,
    (query) => request<any>("/api/agent", query),
  );
  const [visible, setVisible] = useState<boolean>(false);
  const toggleVisible = () => {
    setVisible(!visible);
  };
  const ref = useRef<HTMLDialogElement>(null);
  const handleShow = useCallback(() => {
    ref.current?.showModal();
  }, [ref]);
  if (error) return <div>failed to load</div>;
  if (!data) return <div>Loading...</div>;
  return (
    <>
      <div className="flex justify-between">
        <span className="text-3xl font-semibold">Indexing Rules</span>
        <Button
          color="primary"
          startIcon={<PlusIcon className="w-4" />}
          animation={true}
          onClick={handleShow}
        >
          New Rule
        </Button>
        <Modal open={visible} backdrop={true} className=" max-w-fit" ref={ref}>
          <Modal.Header className="font-bold">New action</Modal.Header>

          <Modal.Body>
            <CreateIndexingRuleForm
              mutate={mutate}
              defaultValues={{}}
              toggleVisible={handleShow}
            />
          </Modal.Body>
        </Modal>
      </div>

      <div className="card mt-3 w-full bg-base-100 shadow-xl">
        <div className="overflow-x-auto">
          <TableComponent
            data={data.indexingRules}
            columns={indexingRuleColumns}
            renderSubComponent={renderSubComponent}
            batchControlsComponent={IndexingRulesActionsBatch}
            mutate={mutate}
            isValidating={isValidating}
            meta={{ mutate }}
          />
        </div>
      </div>
    </>
  );
}
