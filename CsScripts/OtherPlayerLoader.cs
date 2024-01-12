using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Newtonsoft.Json;
using System.Collections.ObjectModel;

public class OtherPlayerLoader : MonoBehaviour
{
    public GameObject prototypeGameObject;
    Dictionary<string, GameObject> playerObject = new();
    private void Start()
    {
        // playerObject.Add("test", Instantiate(prototypeGameObject));
    }

    private void Update()
    {
        foreach (var item in playerObject)
        {
            Vector3 cameraPosition = item.Value.transform.position + new Vector3(0.0f, 1.4f, 0.0f);
            Vector2 objectScreenPos = RectTransformUtility.WorldToScreenPoint(Camera.main, cameraPosition);
            Application.ExternalCall("playerObject", item.Key, objectScreenPos.x, objectScreenPos.y, Camera.main.WorldToScreenPoint(cameraPosition).z, Screen.width, Screen.height);
        }
    }

    public void PlayerData(String data)
    {
        Dictionary<string, List<float[]>> dataDictionary = new Dictionary<string, List<float[]>>();
        foreach (var kvp in JsonConvert.DeserializeObject<Dictionary<string, List<string>>>(data))
        {
            List<float[]> floatList = new List<float[]>();
            foreach (var item in kvp.Value)
            {
                float[] floatArray = Array.ConvertAll(item.Trim('(', ')', ' ').Split(','), float.Parse);
                floatList.Add(floatArray);
            }
            dataDictionary.Add(kvp.Key, floatList);
        }

        Dictionary<string, GameObject> currentPlayerObjects = new Dictionary<string, GameObject>(playerObject);
        foreach (var item in dataDictionary)
        {
            if (!currentPlayerObjects.ContainsKey(item.Key))
            {
                playerObject.Add(item.Key, Instantiate(prototypeGameObject));
            }
            else
            {
                currentPlayerObjects.Remove(item.Key);
                GameObject obj;
                playerObject.TryGetValue(item.Key, out obj);
                obj.transform.position = new Vector3(item.Value[0][0], item.Value[0][1], item.Value[0][2]);
                obj.transform.rotation = new Quaternion(item.Value[1][0], item.Value[1][1], item.Value[1][2], item.Value[1][3]);
                Animator animator = obj.GetComponent<Animator>();
                animator.SetBool("isWalking", item.Value[2][0] == 1f);
                animator.SetBool("isJumping", item.Value[2][1] == 1f);
            }
        }
        foreach (var kvp in currentPlayerObjects)
        {
            Destroy(kvp.Value);
            playerObject.Remove(kvp.Key);
        }
    }
}