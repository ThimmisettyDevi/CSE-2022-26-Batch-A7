import base64
from web3 import Web3
import json

web3 = Web3(Web3.HTTPProvider("http://127.0.0.1:7545"))

one = {"from":"0xA5424a35756220A36cFdA0019631368c452D9D6B"}  #account address

with open("blocks/build/contracts/Store.json") as data:
    contract_file = web3.eth.contract(
        abi = json.load(data)["abi"],
        address = "0x7aD43310eD7F41e49B5Af38DC083910F827Cf14F"  #contacrt address
    )

def addNewData(user:dict) -> str:
    try:
        variable = base64.b64encode(json.dumps(user).encode()).decode()
        contract_file.functions.addString(variable).transact(one)
        return "Success"
    except Exception as e:
        return f'{e}'
    
def retrieveData() ->list|str:
    try:
        data = []
        variable = contract_file.functions.getAll().call(one)
        for i in variable:
            v = json.loads(base64.b64decode(i[1]).decode()) 
            v['sumID'] = i[0]+1
            data.append(v)
        return data
    except Exception as e:
        return f'{e}'
    
def updateData(position:int, data:dict) ->str:
    try:
        pp = base64.b64encode(json.dumps(data).encode()).decode()
        contract_file.functions.updateStore(position,pp).transact(one)
        return "Success"
    except Exception as e:
        return f'{e}'