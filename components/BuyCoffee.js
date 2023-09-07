import { useEffect, useState } from "react"
import {abi, contractAddress} from "../constants/index"
import {ethers} from "ethers"
import {useMoralis, useWeb3Contract} from "react-moralis"
import { useNotification } from "web3uikit"

export default function BuyCoffee(){
    const [message, setMessage] = useState({})
    const [memos, setMemos] = useState([])
    const dispatch = useNotification()
    const {chainId: chainIdHex, isWeb3Enabled, Moralis} = useMoralis()
    const provider = Moralis.web3

    const chainId = parseInt(chainIdHex)
    const address = chainId in contractAddress ? contractAddress[chainId][0] : null
    const signerOrProvider = provider?.getSigner() ?? provider

    const buyMeCoffeeContract = new ethers.Contract(address, abi, signerOrProvider)

    useEffect(() => {
        if(isWeb3Enabled){
            syncMemos()
        }
    }, [isWeb3Enabled])

    const onChangeInput = (e) => {
        message[e.target.name] = e.target.value
        setMessage(message)
    }

    const {runContractFunction: buyCoffee, isLoading, isFetching} = useWeb3Contract({
        abi: abi,
        contractAddress: address,
        functionName: 'buyCoffee',
        params: {_name: message['name'], _message:message['message']},
        msgValue: "1"
    })

    const {runContractFunction: getMemo} = useWeb3Contract({
        abi: abi,
        contractAddress: address,
        functionName: 'getMemo',
        params:{}
    })

    const handleSuccess = async (tx) => {
        await tx.wait(1)
        handleNewNotification(tx)
        await syncMemos()
    }

    const syncMemos = async() =>{
      const res = (await getMemo())
      setMemos(res) 
    }

    const handleNewNotification = function () {
        dispatch({
            type: "info",
            message: "Transaction Complete",
            title: "Tx Notification",
            position: "topR",
            icon: "bell",
        })
    }

    const submitButton = async() => {
        // await buyCoffee({
        //     onSuccess: handleSuccess,
        //     onError: (error) => console.log(error)
        // })
        try{
            const valueInWei = ethers.utils.parseEther("1");
            const tx = await buyMeCoffeeContract.buyCoffee(message['name'], message['message'], {value: valueInWei})
            await tx.wait()
            handleNewNotification()
            await syncMemos()
        }catch(error){
            console.error("Error buy coffee", error)
        }
    }

    const convertDate = (millies) =>{
        const timestamp = millies*1000
        const date = new Date(timestamp)

        const humanTimeStamp = date.toLocaleString()

        return humanTimeStamp
    }

    const withdrawMoney = async() =>{
        try{
            const tx = await buyMeCoffeeContract.withdrawTips()
            await tx.wait()
            handleNewNotification()
        }catch(error){
            console.error("Error buy coffee", error)
        }
    }

    if(!isWeb3Enabled){
        <div className="text-center mt-10">
                <p className="font-bold text-2xl">Connect to Your Wallet First Bro!!</p>
         </div>
    }

    return (
        <>
           <div className="text-center mt-10">
                <p className="font-bold text-2xl">Please Buy Me Coffee For Life Wiith Just 1 ETH And Send Me A Message</p>
            </div>

            <div>
                <button onClick={withdrawMoney} className="border-4 border-green-400 rounded-md p-1" style={{width:'90px', backgroundColor:'lightgreen'}}>Withdraw</button>
            </div>

            <div className="p-3 mt-10">
                <input name="name" className="border-4 border-blue-300" style={{width:'30%'}} placeholder="Name..." onChange={onChangeInput}/>
            </div>
            <div>
                <textarea name="message" className="border-4 border-blue-300" placeholder="Write your message for Tano" style={{width:'29%', height:'200px'}} onChange={onChangeInput}/>
            </div>
            
            <div>
                <button onClick={submitButton} className="border-4 border-blue-400 rounded-md p-1" style={{width:'70px', backgroundColor:'lightblue'}}>Send</button>
            </div>


            <div className="mt-10 al"> 
                <p className="font-bold text-2xl">Memos Received</p>
                {memos.map(data => 
                        <div className="border-4 border-black mb-4" style={{marginRight:'40%', marginLeft:'40%'}}>
                            <p className="font-bold">"{data.message}"</p>
                            <p className="m-3">From : {data.name} at {convertDate(data.timeStamp)}</p>
                        </div>   
                    )}
            </div>
        </>
       
    )
}