import { DocumentSnapshot, onSnapshot } from "firebase/firestore"
import { FirebaseDocumentInfo } from "../../types/index.js"
import { symbols, theme } from "./constants.js"
import { convertMillisToSeconds } from "./utils.js"

/**
 * Return the index of a given participant in a circuit waiting queue.
 * @param contributors <Array<string>> - the list of the contributors in queue for a circuit.
 * @param participantId <string> - the unique identifier of the participant.
 * @returns <number>
 */
const getParticipantPositionInQueue = (contributors: Array<string>, participantId: string): number =>
  contributors.indexOf(participantId) + 1

export default (participantId: string, circuit: FirebaseDocumentInfo) => {
  const unsubscriberForCircuitDocument = onSnapshot(circuit.ref, async (circuitDocSnap: DocumentSnapshot) => {
    // Get updated data from snap.
    const newCircuitData = circuitDocSnap.data()

    if (!newCircuitData) throw new Error(`Something went wrong while retrieving your data`)

    const { avgTimings, waitingQueue } = newCircuitData
    const { avgContributionTime, avgVerificationTime } = avgTimings

    const newParticipantPositionInQueue = getParticipantPositionInQueue(waitingQueue.contributors, participantId)

    let newEstimatedWaitingTime = 0

    if (avgContributionTime > 0 && avgVerificationTime > 0)
      newEstimatedWaitingTime =
        Math.floor(convertMillisToSeconds(avgContributionTime) + convertMillisToSeconds(avgVerificationTime)) *
        (newParticipantPositionInQueue - 1)

    const showTimeEstimation = `${
      newEstimatedWaitingTime > 0
        ? `${`Your est. waiting time is about ~${theme.yellow(newEstimatedWaitingTime)} seconds`}`
        : `No time estimate since the first contributor has not yet finished!`
    }`

    console.log(
      theme.bold(
        `\n${symbols.info} Your position in queue is ${theme.bold(
          theme.yellow(newParticipantPositionInQueue)
        )} now\n${showTimeEstimation}`
      )
    )

    if (newParticipantPositionInQueue === 1) {
      console.log(theme.bold(`\n${symbols.success} It is your go time to contribute 🚀\n`))
      unsubscriberForCircuitDocument()
    } else console.log(theme.bold(`Current contributor: ${theme.yellow(waitingQueue.currentContributor)}`))
  })
}