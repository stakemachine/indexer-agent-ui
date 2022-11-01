import request, { gql } from "graphql-request";
import { FormEvent } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
const queryStatus = gql`{
              

              actions(filter: {}) {
            id
            type
            deploymentID
            allocationID
            amount
            poi
            force
            source
            reason
            priority
            status
            failureReason
            transaction
          }
            
            }`;

const CREATE_ACTION_MUTATION = gql`
  mutation queueActions($actions: [ActionInput!]!) {
          queueActions(actions: $actions) {
            id
            type
            deploymentID
            allocationID
            amount
            poi
            force
            source
            reason
            priority
            status
          }
        }
`;

export enum ActionStatus {
    QUEUED = 'queued',
    APPROVED = 'approved',
    PENDING = 'pending',
    SUCCESS = 'success',
    FAILED = 'failed',
    CANCELED = 'canceled',
}

// type ActionInput = {
//     status: string // ActionStatus
//     type: string // ActionType
//     deploymentID: string
//     allocationID?: string
//     amount?: string
//     poi?: string
//     force?: boolean
//     source?: string
//     reason?: string
//     priority?: number
// }

export enum ActionType {
    ALLOCATE = 'allocate',
    UNALLOCATE = 'unallocate',
    REALLOCATE = 'reallocate',
}

export interface ActionInput {
    type: ActionType
    deploymentID: string
    allocationID?: string
    amount?: string
    poi?: string
    force?: boolean
    source: string
    reason: string
    status: ActionStatus
    priority: number | undefined
}

export default function StatusPage() {
    const { data, error } = useSWR(queryStatus, (query) => request('/api/agent', query));

    const { register, reset, handleSubmit, watch, formState: {  isValid, isSubmitting, errors } } = useForm({
        mode: "onChange",
    });
    // const onSubmit = data => console.log(data);

    const onSubmit = async (data: ActionInput) => {
        data.source = "Agent UI"
        data.reason = "manual"
        data.status = ActionStatus.QUEUED
        data.priority = 0
        if (data.poi == "") {
            data.poi = null
        }
        let actions: ActionInput[] = [data]
        var variables = {
            actions: actions
        }
        // const response = await request('/api/agent', CREATE_ACTION_MUTATION, variables)
        try {
            const response = await request('/api/agent', CREATE_ACTION_MUTATION, variables)
            console.log(JSON.stringify(response, undefined, 2))
            reset()
        } catch (error) {
            console.error(JSON.stringify(error, undefined, 2))
        }
    }

    const watchActionType = watch("type")


    if (error) return <div>failed to load</div>;
    if (!data) return <div>Loading...</ div>;
    return (
        <>
            <label htmlFor="my-modal-6" className="btn modal-button">open modal</label>
            <input type="checkbox" id="my-modal-6" className="modal-toggle" />

            
            <label htmlFor="my-modal-6" className="modal cursor-pointer modal-bottom sm:modal-middle">

                <div className="modal-box">
                    <h3 className="font-bold text-lg">Create action</h3>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        
                        <select name="type" {...register("type", { required: true })} className="select select-bordered select-sm w-full max-w-xs">
                            <option disabled selected>Select action</option>
                            <option value="allocate">Allocate</option>
                            <option value="reallocate">Reallocate</option>
                            <option value="unallocate">Unallocate</option>
                        </select>
                        <input type="text" name="deploymentID" placeholder="Deployment ID" {...register("deploymentID", { required: true })} className="input input-bordered w-full max-w-xs"/>
                        
                        {watchActionType === "reallocate" || watchActionType === "unallocate" ? (
                            <input type="text" placeholder="Allocation ID" {...register("allocationID", { shouldUnregister: true, })} className="input input-bordered w-full max-w-xs" />):""}

                        {watchActionType === "reallocate" || watchActionType === "allocate" ? (
                            <input type="text" placeholder="Amount" {...register("amount", { })} className="input input-bordered w-full max-w-xs" />
                        ):""}
                        
                        {watchActionType === "reallocate" || watchActionType === "unallocate" ? (
                            <input type="text" placeholder="POI" {...register("poi", { shouldUnregister: true, })} className="input input-bordered w-full max-w-xs" />):""}
                        
                        {watchActionType === "reallocate" || watchActionType === "unallocate" ? (
                        <div className="form-control max-w-xs">
                            <label className="label cursor-pointer">
                                <span className="label-text">Force</span>
                                    <input type="checkbox" placeholder="Force" {...register("force", { shouldUnregister: true, })} className="checkbox " />
                            </label>
                        </div>) : "" }
                        
                        <div className="modal-action">
                            <button type="submit" className={ isSubmitting ? "btn loading" : "btn btn-primary"} disabled={!isValid || isSubmitting}>
                                { isSubmitting ? "Loading" : "Create" }
                            </button>
                        </div>
                    </form>
                </div>
            </label>
        </>
    )
}